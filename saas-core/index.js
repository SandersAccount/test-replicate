import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

// Import models
import User from './models/User.js';

// Import routes
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscription.js';
import adminRoutes from './routes/admin.js';

// Import middleware
import auth from './middleware/auth.js';

// Import services
import subscriptionService from './services/subscription.js';

class SaasCore {
    constructor(config = {}) {
        this.config = {
            mongoUri: config.mongoUri || process.env.MONGODB_URI,
            jwtSecret: config.jwtSecret || process.env.JWT_SECRET,
            cookieSecret: config.cookieSecret || process.env.COOKIE_SECRET,
            stripeKey: config.stripeKey || process.env.STRIPE_SECRET_KEY,
            stripeWebhookSecret: config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET
        };

        // Expose middleware
        this.middleware = {
            auth: auth
        };
    }

    async initialize(app) {
        // Connect to MongoDB
        try {
            await mongoose.connect(this.config.mongoUri);
            console.log('MongoDB connected successfully');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }

        // Middleware
        app.use(cookieParser(this.config.cookieSecret));
        app.use(express.json());

        // Debug route mounting
        console.log('\n=== Mounting Routes ===');
        console.log('Auth routes will be mounted at: /api/auth');
        console.log('Subscription routes will be mounted at: /api/subscription');
        console.log('Admin routes will be mounted at: /api/admin');
        console.log('=====================\n');

        // Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/subscription', subscriptionRoutes);
        app.use('/api/admin', adminRoutes);

        // Initialize subscription service
        try {
            await subscriptionService.initialize(this.config.stripeKey);
        } catch (error) {
            console.warn('Stripe initialization failed. Running in development mode without Stripe.');
        }

        // Root API route (must be after other routes)
        app.get('/api', (req, res) => {
            res.json({
                message: 'SAAS Core API',
                endpoints: {
                    '/auth': 'Authentication endpoints',
                    '/subscription': 'Subscription management endpoints',
                    '/admin': 'Admin endpoints'
                }
            });
        });
    }

    // Export models and services for external use
    getModels() {
        return {
            User
        };
    }

    getServices() {
        return {
            subscription: subscriptionService
        };
    }
}

export default SaasCore;
