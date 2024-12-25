import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import auth from './middleware/auth.js';
import adminAuth from './middleware/adminAuth.js';
import imageGenerator from './services/imageGenerator.js';
import Generation from './models/Generation.js';
import Collection from './models/Collection.js'; 
import jwt from 'jsonwebtoken'; 
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscription.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3005;

// Connect to MongoDB
try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
} catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
}

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3005', 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'] 
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Debug middleware - log all requests
app.use((req, res, next) => {
    console.log('\n=== Incoming Request ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);
    console.log('Cookies:', req.cookies);
    console.log('======================\n');
    next();
});

// Serve static files from the public directory
app.use(express.static('public'));

// Auth middleware for protected routes
const authMiddleware = async (req, res, next) => {
    try {
        console.log('Auth middleware - checking token');
        console.log('Cookies:', req.cookies);
        const token = req.cookies.token;
        
        if (!token) {
            console.log('No token found, redirecting to login');
            if (req.path === '/' || req.path.startsWith('/api/')) {
                return res.redirect('/login');
            }
            throw new Error('No token provided');
        }

        console.log('Verifying token');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded || !decoded.userId) {
            console.log('Invalid token');
            throw new Error('Invalid token');
        }

        console.log('Finding user:', decoded.userId);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            console.log('User not found');
            throw new Error('User not found');
        }

        console.log('User authenticated:', user.email);
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        if (req.path === '/' || req.path.startsWith('/api/')) {
            return res.redirect('/login');
        }
        res.status(401).json({ error: 'Please authenticate' });
    }
};

// Admin middleware
const adminMiddleware = async (req, res, next) => {
    try {
        console.log('Admin check for user:', req.user);
        if (!req.user || req.user.role !== 'admin') {
            console.log('Access denied: User is not admin');
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }
        console.log('Admin access granted');
        next();
    } catch (error) {
        console.error('Admin middleware error:', error.message);
        res.status(403).json({ error: 'Access denied' });
    }
};

// Auth routes
app.get('/login', (req, res) => {
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
        console.log('Login attempt:', req.body);
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log('Login failed: User not found');
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Login failed: Invalid password');
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Set admin privileges for admin@example.com
        if (email === 'admin@example.com' && !user.isAdmin) {
            console.log('Setting admin privileges for admin user');
            user.isAdmin = true;
            await user.save();
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('Login successful, setting cookie');
        
        // Set cookie with explicit options
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to false for local development
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        console.log('Cookie set, sending response');
        
        // Send response with redirect URL
        res.json({ 
            message: 'Login successful',
            redirect: '/',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: 'Invalid email or password' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// Protected routes - require authentication
app.get('/', authMiddleware, (req, res) => {
    console.log('Serving index page for authenticated user:', req.user.email);
    res.sendFile(join(__dirname, 'index.html'));
});

app.get('/collections', authMiddleware, (req, res) => {
    console.log('Serving collections page for user:', req.user.email);
    res.sendFile(join(__dirname, 'collections.html'));
});

app.get('/profile', authMiddleware, (req, res) => {
    console.log('Serving profile page for user:', req.user.email);
    res.sendFile(join(__dirname, 'profile.html'));
});

app.get('/index.html', authMiddleware, (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

app.get('/admin', authMiddleware, adminMiddleware, (req, res) => {
    res.sendFile(join(__dirname, 'admin.html'));
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
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
app.put('/api/admin/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
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
app.put('/api/admin/users/:id/plan', authMiddleware, adminMiddleware, async (req, res) => {
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

app.post('/generate', authMiddleware, async (req, res) => {
    try {
        console.log('=== Starting Image Generation ===');
        console.log('Request body:', req.body);
        
        const { prompt } = req.body;
        
        if (!prompt) {
            throw new Error('Prompt is required');
        }

        const output = await imageGenerator.generateSticker(prompt);
        console.log('Generation successful:', output);

        // Save generation to database with userId
        const generation = new Generation({
            userId: req.user._id,
            prompt: prompt,
            imageData: output[0]
        });
        await generation.save();

        res.json(generation);
    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({ error: error.message });
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
            title
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
            .sort({ createdAt: -1 });

        // Get the latest images for each collection
        const collectionsWithImages = await Promise.all(collections.map(async (collection) => {
            const recentImages = await Generation.find({ 
                userId: req.user._id,
                collectionId: collection._id 
            })
            .sort({ createdAt: -1 })
            .limit(4)
            .select('imageData');

            return {
                ...collection.toObject(),
                recentImages: recentImages.map(img => img.imageData),
                imageCount: recentImages.length
            };
        }));

        res.json(collectionsWithImages);
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
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const images = await Generation.find({
            userId: req.user._id,
            collectionId: collection._id
        })
        .sort({ createdAt: -1 })
        .select('imageData prompt createdAt');

        res.json({
            collection,
            images
        });
    } catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({ error: 'Failed to fetch collection' });
    }
});

app.get('/collection/:id', authMiddleware, (req, res) => {
    console.log('Serving collection page for user:', req.user.email);
    res.sendFile(join(__dirname, 'collection.html'));
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

// Add image to collection
app.post('/api/collections/:collectionId/images', authMiddleware, async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { generationId } = req.body;

        const collection = await Collection.findOne({
            _id: collectionId,
            userId: req.user._id
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        await Generation.findOneAndUpdate(
            { _id: generationId, userId: req.user._id },
            { collectionId }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding image to collection:', error);
        res.status(500).json({ error: error.message });
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

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
