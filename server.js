import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import Replicate from 'replicate';
import SaasCore from './saas-core/index.js';
import adminAuth from './saas-core/middleware/adminAuth.js';

// Load environment variables
dotenv.config();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3004;

// Initialize SAAS core
const saasCore = new SaasCore({
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    cookieSecret: process.env.COOKIE_SECRET,
    stripeKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET
});

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3004', // Be specific about origin in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'] // Allow browser to see Set-Cookie header
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

// Initialize SAAS core with our app
await saasCore.initialize(app);

// Serve static files
app.use(express.static(join(__dirname, 'public')));

// Initialize Replicate client
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Public routes
app.get('/auth', (req, res) => {
    res.sendFile(join(__dirname, 'auth.html'));
});

app.get('/plans', (req, res) => {
    res.sendFile(join(__dirname, 'plans.html'));
});

// Protected admin routes
app.get('/admin', saasCore.middleware.auth, adminAuth, (req, res) => {
    res.sendFile(join(__dirname, 'admin.html'));
});

// Protected routes
app.get('/', saasCore.middleware.auth, (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

app.get('/profile', saasCore.middleware.auth, (req, res) => {
    res.sendFile(join(__dirname, 'profile.html'));
});

// API routes
app.post('/generate', async (req, res) => {
    try {
        console.log('Received request body:', req.body);
        const { prompt, model = 'sticker' } = req.body;
        if (!prompt) {
            throw new Error('Prompt is required');
        }

        console.log('Starting image generation with prompt:', prompt, 'using model:', model);

        const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: prompt
                }
            }
        );

        res.json({ output });
    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
