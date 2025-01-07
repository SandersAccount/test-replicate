import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import './config/database.js';  // Import database connection
import Replicate from 'replicate';
import { saveImageFromUrl } from './utils/storage.js';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import auth from './middleware/auth.js';
import adminAuth from './middleware/adminAuth.js';
import imageGenerator from './services/imageGenerator.js';
import Generation from './models/Generation.js';
import Collection from './models/Collection.js'; 
import jwt from 'jsonwebtoken'; 
import User from './models/user.js';
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscription.js';
import adminRoutes from './routes/admin.js';
import creditsRoutes from './routes/credits.js';
import Style from './models/Style.js';
import multer from 'multer';
import fs from 'fs';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3005;

// Initialize Replicate with API token
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Auth middleware for protected routes
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware
app.use(cors({
    origin: 'http://localhost:3005',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files
app.use(express.static(join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Store in the storage/styles directory
        const uploadDir = path.join(__dirname, 'public/storage/styles');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Image generation endpoint
app.post('/api/generate', authMiddleware, async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log('Starting image generation...');
        console.log('User:', req.user._id);
        console.log('Prompt:', prompt);

        // Check if user has enough credits
        if (req.user.credits < 1) {
            return res.status(403).json({ error: 'Not enough credits' });
        }

        if (!process.env.REPLICATE_API_TOKEN) {
            console.error('REPLICATE_API_TOKEN not found in environment variables');
            return res.status(500).json({ error: 'Replicate API token not configured' });
        }

        const modelVersion = "fofr/sticker-maker:4acb778eb059772225ec213948f0660867b2e03f277448f18cf1800b96a65a1a";
        
        try {
            const output = await replicate.run(
                modelVersion,
                {
                    input: {
                        steps: 17,
                        width: 1152,
                        height: 1152,
                        prompt: prompt,
                        output_format: "webp",
                        output_quality: 100,
                        negative_prompt: "ugly, blurry, poor quality, distorted",
                        number_of_images: 1
                    }
                }
            );

            console.log('Generation output:', output);

            if (!output || !Array.isArray(output) || output.length === 0) {
                console.error('Invalid output from Replicate:', output);
                throw new Error('Invalid output from image generation');
            }

            // Save the image locally
            const imageUrl = output[0];
            const savedImage = await saveImageFromUrl(imageUrl);
            console.log('Image saved locally:', savedImage);

            // Save the generation to the database
            const generation = new Generation({
                userId: req.user._id,
                prompt: prompt,
                imageData: savedImage.publicUrl,
                fileName: savedImage.fileName,
                status: 'completed',
                createdAt: new Date()
            });

            await generation.save();
            console.log('Generation saved:', generation);

            // Deduct 1 credit from user
            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                { $inc: { credits: -1 } },
                { new: true }
            );

            res.json({
                generation: {
                    _id: generation._id,
                    imageUrl: generation.imageData,
                    prompt: generation.prompt,
                    timestamp: generation.createdAt
                },
                credits: updatedUser.credits
            });
        } catch (replicateError) {
            console.error('Replicate API error:', replicateError);
            if (replicateError.response) {
                console.error('Response status:', replicateError.response.status);
                console.error('Response data:', replicateError.response.data);
            }
            throw new Error(`Replicate API error: ${replicateError.message}`);
        }
    } catch (error) {
        console.error('Error generating image:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to generate image', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Auth routes
app.get('/login', (req, res) => {
    const token = req.cookies.JWT_TOKEN;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/');
        } catch (error) {
            // Invalid token, continue to login page
        }
    }
    res.sendFile(join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(join(__dirname, 'register.html'));
});

// Auth API endpoints
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password
        });

        await user.save();
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Set cookie with token
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Send response
        res.json({
            user: {
                _id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// Protected routes - require authentication
app.get('/', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            res.sendFile(join(__dirname, 'index.html'));
        } catch (error) {
            res.sendFile(join(__dirname, 'login.html'));
        }
    } else {
        res.sendFile(join(__dirname, 'login.html'));
    }
});

app.get('/collections', authMiddleware, (req, res) => {
    console.log('Serving collections page for user:', req.user.email);
    res.sendFile(join(__dirname, 'collections.html'));
});

app.get('/generate', authMiddleware, (req, res) => {
    console.log('Serving generate page for user:', req.user.email);
    res.sendFile(join(__dirname, 'generate.html'));
});

app.get('/profile', authMiddleware, (req, res) => {
    console.log('Serving profile page for user:', req.user.email);
    res.sendFile(join(__dirname, 'profile.html'));
});

app.get('/index.html', authMiddleware, (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

app.get('/admin', authMiddleware, adminAuth, (req, res) => {
    res.sendFile(join(__dirname, 'admin.html'));
});

app.get('/api/admin/users', authMiddleware, adminAuth, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.get('/api/admin/stats', authMiddleware, adminAuth, async (req, res) => {
    try {
        // Get user statistics
        const totalUsers = await User.countDocuments();
        const proUsers = await User.countDocuments({ 'subscription.plan': 'pro' });
        const totalGenerations = await Generation.countDocuments();

        // Get recent activity
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('-password');

        const recentGenerations = await Generation.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'name email');

        res.json({
            users: {
                total: totalUsers,
                pro: proUsers
            },
            generations: {
                total: totalGenerations
            },
            recent: {
                users: recentUsers,
                generations: recentGenerations
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

// Toggle user role
app.put('/api/admin/users/:id/role', authMiddleware, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.isAdmin = !user.isAdmin;
        await user.save();

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error toggling user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Update user plan
app.put('/api/admin/users/:id/plan', authMiddleware, adminAuth, async (req, res) => {
    try {
        const { plan } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { 
                    'subscription.plan': plan,
                    'subscription.startDate': new Date(),
                    'subscription.status': 'active'
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error updating user plan:', error);
        res.status(500).json({ error: 'Failed to update user plan' });
    }
});

// Public routes
app.get('/auth', (req, res) => {
    // If user is already logged in, redirect to home
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/');
        } catch (error) {
            // Token is invalid, continue to auth page
        }
    }
    res.sendFile(join(__dirname, 'auth.html'));
});

// API routes - Update to be user-specific
app.get('/api/generations', authMiddleware, async (req, res) => {
    try {
        const generations = await Generation.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(generations);
    } catch (error) {
        console.error('Error fetching generations:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/generations/recent', authMiddleware, async (req, res) => {
    try {
        console.log('Fetching recent generations for user:', req.user._id);
        const generations = await Generation.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        console.log(`Found ${generations.length} recent generations`);
        
        // Map the generations to include only necessary data
        const mappedGenerations = generations.map(gen => ({
            _id: gen._id,
            prompt: gen.prompt,
            imageUrl: gen.imageData, // Use the stored public URL directly
            createdAt: gen.createdAt
        }));

        res.json(mappedGenerations);
    } catch (error) {
        console.error('Error fetching recent generations:', error);
        res.status(500).json({ 
            error: 'Failed to fetch recent generations',
            details: error.message 
        });
    }
});

// Delete a generation
app.delete('/api/generations/:id', authMiddleware, async (req, res) => {
    try {
        const generation = await Generation.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!generation) {
            return res.status(404).json({ error: 'Generation not found' });
        }

        // Move to trash by updating the status
        generation.status = 'deleted';
        await generation.save();

        res.json({ message: 'Generation moved to trash' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to move generation to trash' });
    }
});

// Collections API endpoints - Update to be user-specific
app.post('/api/collections', authMiddleware, async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            throw new Error('Title is required');
        }

        const collection = new Collection({
            userId: req.user._id,
            title,
            stats: {
                imageCount: 0,
                viewCount: 0,
                lastModified: new Date()
            }
        });
        await collection.save();

        res.json(collection);
    } catch (error) {
        console.error('Error creating collection:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/collections', authMiddleware, async (req, res) => {
    try {
        const collections = await Collection.find({ userId: req.user._id })
            .sort({ 'stats.lastModified': -1 })
            .populate('images');

        // Get preview images for each collection
        const collectionsWithPreviews = collections.map(collection => {
            const collectionObj = collection.toObject();
            // Use the first 4 images as previews
            collectionObj.previewImages = collection.images
                .slice(0, 4)
                .map(img => ({ imageData: img.imageData }));
            return collectionObj;
        });

        res.json(collectionsWithPreviews);
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({ error: 'Failed to fetch collections' });
    }
});

app.get('/api/collections/:id', authMiddleware, async (req, res) => {
    try {
        const collection = await Collection.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate('images', 'imageData prompt'); // Add prompt to the populated fields

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        res.json(collection);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch collection' });
    }
});

app.get('/collection/:id', authMiddleware, (req, res) => {
    console.log('Serving collection page for user:', req.user.email);
    res.sendFile(join(__dirname, 'collection.html'));
});

app.post('/api/collections/:collectionId/images', authMiddleware, async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { imageUrl, prompt } = req.body;

        console.log('Request body:', req.body);
        console.log('Adding image to collection:', {
            collectionId,
            imageUrl,
            prompt,
            userId: req.user._id
        });

        // Find the collection
        const collection = await Collection.findOne({
            _id: collectionId,
            userId: req.user._id
        });

        if (!collection) {
            console.log('Collection not found:', collectionId);
            return res.status(404).json({ error: 'Collection not found' });
        }

        console.log('Found collection:', collection.title);

        // Create a new Generation record
        const generation = new Generation({
            userId: req.user._id,
            prompt: prompt || 'No prompt',
            imageData: imageUrl,
            fileName: 'collection-image.png', // Default filename
            status: 'completed'
        });

        console.log('Created generation:', {
            userId: generation.userId,
            prompt: generation.prompt,
            imageData: generation.imageData
        });

        await generation.save();
        console.log('Saved generation with ID:', generation._id);

        // Add the generation reference to the collection
        collection.images.push(generation._id);

        // Update collection stats
        collection.stats = collection.stats || {};
        collection.stats.imageCount = collection.images.length;
        collection.stats.lastModified = new Date();

        // Set cover image if this is the first image
        if (!collection.coverImage && imageUrl) {
            collection.coverImage = imageUrl;
        }

        await collection.save();
        console.log('Updated collection successfully');

        res.json({ 
            message: 'Image added to collection successfully',
            collection
        });
    } catch (error) {
        console.error('Error adding image to collection:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to add image to collection', details: error.message });
    }
});

app.delete('/api/collections/:collectionId/images/:imageId', authMiddleware, async (req, res) => {
    try {
        const { collectionId, imageId } = req.params;

        const collection = await Collection.findOne({
            _id: collectionId,
            userId: req.user._id
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        // Remove image from collection's images array
        collection.images = collection.images.filter(id => id.toString() !== imageId);
        
        // Update collection stats
        collection.stats.imageCount = collection.images.length;
        collection.stats.lastModified = new Date();

        // Update cover image if needed
        if (collection.coverImage && collection.coverImage === imageId) {
            collection.coverImage = collection.images[0] || null;
        }

        await collection.save();

        res.json({ message: 'Image removed from collection' });
    } catch (error) {
        console.error('Error removing image from collection:', error);
        res.status(500).json({ error: 'Failed to remove image from collection' });
    }
});

// Delete generation - ensure user can only delete their own
app.delete('/api/generations/:id', authMiddleware, async (req, res) => {
    try {
        const generation = await Generation.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!generation) {
            return res.status(404).json({ error: 'Generation not found' });
        }

        await generation.deleteOne();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting generation:', error);
        res.status(500).json({ error: 'Failed to delete generation' });
    }
});

// User API routes
app.get('/api/auth/user', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        console.log('Fetched user data:', user);
        res.json(user);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// API route for user profile
app.get('/api/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update profile
app.put('/api/profile', authMiddleware, async (req, res) => {
    try {
        const { name, nickname, bio } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { name, nickname, bio } },
            { new: true }
        ).select('-password');
        
        res.json(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Serve admin-styles page
app.get('/admin-styles', authMiddleware, adminAuth, (req, res) => {
    res.sendFile(join(__dirname, 'admin-styles.html'));
});

// Style management endpoints
app.get('/api/admin/styles', authMiddleware, adminAuth, async (req, res) => {
    try {
        const styles = await Style.find().sort({ order: 1 });
        
        // Map styles to include correct image URLs
        const mappedStyles = styles.map(style => ({
            _id: style._id,
            name: style.name,
            prompt: style.prompt,
            imageUrl: style.imageUrl.startsWith('http') ? style.imageUrl : `${process.env.PUBLIC_URL}${style.imageUrl}`
        }));

        res.json(mappedStyles);
    } catch (error) {
        console.error('Error fetching styles:', error);
        res.status(500).json({ error: 'Failed to fetch styles' });
    }
});

app.post('/api/admin/styles', authMiddleware, adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, prompt } = req.body;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        // Move the file to the public/images directory
        const fileName = `${Date.now()}-${imageFile.originalname}`;
        const targetPath = join(__dirname, 'public', 'images', fileName);
        
        await fs.promises.rename(imageFile.path, targetPath);

        // Create new style
        const style = new Style({
            name,
            prompt,
            imageUrl: `/images/${fileName}`,
            order: await Style.countDocuments() // Add at the end
        });

        await style.save();
        res.status(201).json(style);
    } catch (error) {
        console.error('Error adding style:', error);
        res.status(500).json({ error: 'Failed to add style' });
    }
});

app.delete('/api/admin/styles/:id', authMiddleware, adminAuth, async (req, res) => {
    try {
        const style = await Style.findById(req.params.id);
        if (!style) {
            return res.status(404).json({ error: 'Style not found' });
        }

        // Delete the image file if it exists and is local
        if (!style.imageUrl.startsWith('http')) {
            const imagePath = join(__dirname, 'public', style.imageUrl);
            try {
                await fs.promises.unlink(imagePath);
            } catch (err) {
                console.error('Error deleting image file:', err);
                // Continue even if file deletion fails
            }
        }

        await style.deleteOne();
        res.json({ message: 'Style deleted successfully' });
    } catch (error) {
        console.error('Error deleting style:', error);
        res.status(500).json({ error: 'Failed to delete style' });
    }
});

// Get all styles with sorting
app.get('/api/styles', async (req, res) => {
    try {
        const { sortBy = 'order', sortOrder = 'asc' } = req.query;
        
        // Validate sort parameters
        const validSortFields = ['name', 'order'];
        const validSortOrders = ['asc', 'desc'];
        
        if (!validSortFields.includes(sortBy) || !validSortOrders.includes(sortOrder)) {
            return res.status(400).json({ error: 'Invalid sort parameters' });
        }

        // Create sort object
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        
        const styles = await Style.find().sort(sort);

        // Map styles to include correct image URLs
        const mappedStyles = styles.map(style => ({
            _id: style._id,
            name: style.name,
            prompt: style.prompt,
            order: style.order,
            imageUrl: style.imageUrl.startsWith('http') ? style.imageUrl : `${process.env.PUBLIC_URL}${style.imageUrl}`
        }));

        res.json(mappedStyles);
    } catch (error) {
        console.error('Error fetching styles:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin route to manage styles
app.get('/styles', async (req, res) => {
    try {
        // Check if user is logged in and is admin
        const token = req.cookies.token;
        if (!token) {
            return res.redirect('/login');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.isAdmin) {
            return res.redirect('/login');
        }

        res.sendFile(join(__dirname, 'admin-styles.html'));
    } catch (error) {
        console.error('Error accessing admin styles:', error);
        res.status(500).send('Server error');
    }
});

// Get all styles
app.get('/api/styles', async (req, res) => {
    try {
        const styles = await Style.find().sort({ order: 1 });
        
        // Map styles to include correct image URLs
        const mappedStyles = styles.map(style => ({
            _id: style._id,
            name: style.name,
            prompt: style.prompt,
            imageUrl: style.imageUrl.startsWith('http') ? style.imageUrl : `${process.env.PUBLIC_URL}${style.imageUrl}`
        }));

        res.json(mappedStyles);
    } catch (error) {
        console.error('Error fetching styles:', error);
        res.status(500).json({ error: 'Failed to fetch styles' });
    }
});

// Add new style
app.post('/api/styles', authMiddleware, adminAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const { name, prompt } = req.body;
        if (!name || !prompt) {
            return res.status(400).json({ error: 'Name and prompt are required' });
        }

        // Get the relative path for storage
        const relativePath = path.relative(
            path.join(__dirname, 'public'),
            req.file.path
        ).replace(/\\/g, '/'); // Convert Windows backslashes to forward slashes

        // Create new style
        const style = new Style({
            name,
            prompt,
            imageUrl: '/' + relativePath // Add leading slash for URL path
        });

        await style.save();
        res.status(201).json(style);
    } catch (error) {
        console.error('Error creating style:', error);
        res.status(500).json({ error: error.message || 'Failed to create style' });
    }
});

app.delete('/api/styles/:id', authMiddleware, adminAuth, async (req, res) => {
    try {
        await Style.findByIdAndDelete(req.params.id);
        res.json({ message: 'Style deleted successfully' });
    } catch (error) {
        console.error('Error deleting style:', error);
        res.status(500).json({ error: 'Failed to delete style' });
    }
});

// Update style (admin)
app.put('/api/styles/:id', authMiddleware, adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, prompt } = req.body;
        const style = await Style.findById(req.params.id);
        
        if (!style) {
            return res.status(404).json({ error: 'Style not found' });
        }

        // Update basic info
        style.name = name;
        style.prompt = prompt;

        // Handle image update if provided
        if (req.file) {
            // Delete old image if it exists and is local
            if (!style.imageUrl.startsWith('http')) {
                const oldImagePath = join(__dirname, 'public', style.imageUrl);
                try {
                    await fs.promises.unlink(oldImagePath);
                } catch (err) {
                    console.error('Error deleting old image:', err);
                    // Continue even if file deletion fails
                }
            }

            // Save new image
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const targetPath = join(__dirname, 'public', 'images', fileName);
            await fs.promises.rename(req.file.path, targetPath);
            style.imageUrl = `/images/${fileName}`;
        }

        await style.save();
        res.json(style);
    } catch (error) {
        console.error('Error updating style:', error);
        res.status(500).json({ error: 'Failed to update style' });
    }
});

// Admin styles page
app.get('/styles', authMiddleware, adminAuth, (req, res) => {
    res.sendFile(join(__dirname, 'admin-styles.html'));
});

// Get all styles
app.get('/api/styles', async (req, res) => {
    try {
        const styles = await Style.find().sort({ order: 1 });
        
        // Map styles to include correct image URLs
        const mappedStyles = styles.map(style => ({
            _id: style._id,
            name: style.name,
            prompt: style.prompt,
            imageUrl: style.imageUrl.startsWith('http') ? style.imageUrl : `${process.env.PUBLIC_URL}${style.imageUrl}`
        }));

        res.json(mappedStyles);
    } catch (error) {
        console.error('Error fetching styles:', error);
        res.status(500).json({ error: 'Failed to fetch styles' });
    }
});

// Add new style
app.post('/api/styles', authMiddleware, adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, prompt } = req.body;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        // Move the file to the public/images directory
        const fileName = `${Date.now()}-${imageFile.originalname}`;
        const targetPath = join(__dirname, 'public', 'images', fileName);
        
        await fs.promises.rename(imageFile.path, targetPath);

        // Create new style
        const style = new Style({
            name,
            prompt,
            imageUrl: `/images/${fileName}`,
            order: await Style.countDocuments() // Add at the end
        });

        await style.save();
        res.status(201).json(style);
    } catch (error) {
        console.error('Error adding style:', error);
        res.status(500).json({ error: 'Failed to add style' });
    }
});

// Update style (admin)
app.put('/api/styles/:id', authMiddleware, adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, prompt } = req.body;
        const style = await Style.findById(req.params.id);
        
        if (!style) {
            return res.status(404).json({ error: 'Style not found' });
        }

        // Update basic info
        style.name = name;
        style.prompt = prompt;

        // Handle image update if provided
        if (req.file) {
            // Delete old image if it exists and is local
            if (!style.imageUrl.startsWith('http')) {
                const oldImagePath = join(__dirname, 'public', style.imageUrl);
                try {
                    await fs.promises.unlink(oldImagePath);
                } catch (err) {
                    console.error('Error deleting old image:', err);
                    // Continue even if file deletion fails
                }
            }

            // Save new image
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const targetPath = join(__dirname, 'public', 'images', fileName);
            await fs.promises.rename(req.file.path, targetPath);
            style.imageUrl = `/images/${fileName}`;
        }

        await style.save();
        res.json(style);
    } catch (error) {
        console.error('Error updating style:', error);
        res.status(500).json({ error: 'Failed to update style' });
    }
});

// Delete style (admin)
app.delete('/api/styles/:id', authMiddleware, adminAuth, async (req, res) => {
    try {
        const style = await Style.findById(req.params.id);
        if (!style) {
            return res.status(404).json({ error: 'Style not found' });
        }

        // Delete the image file if it exists and is local
        if (!style.imageUrl.startsWith('http')) {
            const imagePath = join(__dirname, 'public', style.imageUrl);
            try {
                await fs.promises.unlink(imagePath);
            } catch (err) {
                console.error('Error deleting image file:', err);
                // Continue even if file deletion fails
            }
        }

        await style.deleteOne();
        res.json({ message: 'Style deleted successfully' });
    } catch (error) {
        console.error('Error deleting style:', error);
        res.status(500).json({ error: 'Failed to delete style' });
    }
});

// Get all styles
app.get('/api/styles', authMiddleware, async (req, res) => {
    try {
        const styles = await Style.find().sort({ order: 1 });
        res.json(styles);
    } catch (error) {
        console.error('Error fetching styles:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add new style
app.post('/api/styles', authMiddleware, adminAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const { name, prompt } = req.body;
        if (!name || !prompt) {
            return res.status(400).json({ error: 'Name and prompt are required' });
        }

        // Get highest order value
        const lastStyle = await Style.findOne().sort({ order: -1 });
        const newOrder = lastStyle ? lastStyle.order + 1 : 0;

        // Get the relative path for storage
        const relativePath = path.relative(
            path.join(__dirname, 'public'),
            req.file.path
        ).replace(/\\/g, '/');

        // Create new style
        const style = new Style({
            name,
            prompt,
            imageUrl: '/' + relativePath,
            order: newOrder
        });

        await style.save();
        res.status(201).json(style);
    } catch (error) {
        console.error('Error creating style:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reorder style
app.post('/api/styles/reorder', authMiddleware, adminAuth, async (req, res) => {
    try {
        const { styleId, direction } = req.body;
        
        const currentStyle = await Style.findById(styleId);
        if (!currentStyle) {
            return res.status(404).json({ error: 'Style not found' });
        }

        // Find adjacent style
        const query = direction === 'up' 
            ? { order: { $lt: currentStyle.order } }
            : { order: { $gt: currentStyle.order } };
            
        const adjacentStyle = await Style.findOne(query).sort(direction === 'up' ? { order: -1 } : { order: 1 });
        
        if (!adjacentStyle) {
            return res.status(400).json({ error: 'Cannot move further in that direction' });
        }

        // Swap orders
        const tempOrder = currentStyle.order;
        currentStyle.order = adjacentStyle.order;
        adjacentStyle.order = tempOrder;

        await Promise.all([
            currentStyle.save(),
            adjacentStyle.save()
        ]);

        res.json({ message: 'Style reordered successfully' });
    } catch (error) {
        console.error('Error reordering style:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save style order
app.post('/api/styles/save-order', authMiddleware, adminAuth, async (req, res) => {
    try {
        const { styles } = req.body;
        
        if (!Array.isArray(styles)) {
            return res.status(400).json({ error: 'Invalid styles array' });
        }

        // Update each style's order in the database
        const updatePromises = styles.map((style, index) => {
            return Style.findByIdAndUpdate(
                style._id,
                { $set: { order: index } },
                { new: true }
            );
        });

        await Promise.all(updatePromises);
        
        res.json({ message: 'Style order saved successfully' });
    } catch (error) {
        console.error('Error saving style order:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/credits', creditsRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
