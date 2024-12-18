# SAAS Core Module

A comprehensive SAAS core module that provides authentication, subscription management, and user administration functionality.

## Features

- User Authentication (Login/Register)
- Role-based Access Control (User/Admin)
- Subscription Management with Stripe Integration
- User Profile Management
- Admin Dashboard with User Management
- Usage Tracking and Statistics
- Webhook Integration for Subscription Events

## Installation

```bash
npm install ./saas-core
```

## Configuration

Create a `.env` file with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
COOKIE_SECRET=your_cookie_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRO_PRICE_ID=your_stripe_price_id_for_pro_plan
```

## Usage

```javascript
const express = require('express');
const SaasCore = require('saas-core');

const app = express();

// Initialize SAAS core
const saasCore = new SaasCore({
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    cookieSecret: process.env.COOKIE_SECRET,
    stripeKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET
});

// Initialize the module with your Express app
await saasCore.initialize(app);

// Access models and services
const { User } = saasCore.getModels();
const { subscription } = saasCore.getServices();
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user
- POST `/api/auth/logout` - Logout user
- PUT `/api/auth/update` - Update user profile

### Subscription
- GET `/api/subscription/plans` - Get available plans
- GET `/api/subscription/current` - Get current subscription
- POST `/api/subscription/subscribe/:planId` - Subscribe to plan
- POST `/api/subscription/cancel` - Cancel subscription
- POST `/api/subscription/webhook` - Stripe webhook endpoint

### Admin
- GET `/api/admin/users` - Get all users (with pagination)
- GET `/api/admin/users/:userId` - Get user details
- PUT `/api/admin/users/:userId` - Update user
- GET `/api/admin/stats` - Get usage statistics

## Plans

Two subscription plans are available out of the box:

### Free Plan
- Generate up to 50 images per month
- Save up to 5 presets
- Basic support

### Pro Plan
- Generate up to 500 images per month
- Save up to 50 presets
- Priority support
- Advanced customization options
- API access

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Secure cookie settings
- Role-based access control
- Input validation using express-validator

## Error Handling

All endpoints include proper error handling and return appropriate HTTP status codes and error messages.

## Customization

You can customize the module by:

1. Modifying the plan configurations in `config/plans.js`
2. Extending the User model in `models/User.js`
3. Adding new routes or modifying existing ones
4. Customizing the subscription service behavior

## Contributing

Feel free to submit issues and enhancement requests!
