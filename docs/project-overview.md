# AI Image Generator Web Application

## Project Overview
This is a web-based AI image generation application that allows users to create, manage, and share AI-generated images. The application features a credit-based system, user authentication, and collection management.

## Core Features

### 1. Authentication System
- User registration and login
- JWT-based authentication with secure cookie storage
- Password hashing using bcrypt
- Role-based access control (user/admin)
- Protected routes requiring authentication

### 2. Credits System
- Users start with 100 free credits
- Credit purchase functionality
  - Slider-based credit selection (100-1000 credits)
  - Dynamic pricing with bulk discounts
  - Admin approval system for credit purchases
- Credit usage tracking
- Credit history and expiration management

### 3. User Management
- User profile management
  - Personal information updates
  - Subscription status
  - Credit balance viewing
- Admin dashboard
  - User list viewing and management
  - Credit request approval
  - User role management
  - Usage statistics

### 4. Collections Management
- Create and manage image collections
- Add/remove images from collections
- Share collections with other users
- Collection privacy settings
- Collection thumbnails and metadata

### 5. Navigation and UI
- Responsive top navigation bar
- Dark theme design
- Modern and intuitive user interface
- Modal-based interactions
- Loading states and error handling

## Technical Architecture

### Frontend
- Pure JavaScript (No framework)
- HTML5 & CSS3
- Responsive design
- Client-side form validation
- Dynamic content loading
- Modal components

### Backend
- Node.js with Express
- MongoDB with Mongoose ODM
- JWT authentication
- RESTful API architecture
- Middleware for authentication and authorization

### Security Features
- Password hashing
- JWT token management
- Protected API endpoints
- Role-based access control
- CORS configuration
- Input validation and sanitization

## Project Structure
```
test-replicate/
├── config/
│   ├── database.js     # MongoDB configuration
│   └── plans.js        # Subscription plans configuration
├── docs/
│   └── project-overview.md
├── middleware/
│   ├── auth.js         # Authentication middleware
│   └── adminAuth.js    # Admin authorization middleware
├── models/
│   └── User.js         # User model with credit request schema
├── public/
│   ├── js/
│   │   ├── topbar.js   # Navigation bar functionality
│   │   └── utils.js    # Shared utilities
│   ├── styles.css      # Global styles
│   └── images/         # Static images
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── admin.js        # Admin management routes
│   ├── credits.js      # Credit system routes
│   └── subscription.js # Subscription management routes
├── views/
│   ├── admin.html      # Admin dashboard
│   ├── profile.html    # User profile page
│   ├── collections.html# Collections management
│   └── index.html      # Landing page
├── server.js           # Main application entry
└── package.json        # Project dependencies
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user
- POST `/api/auth/logout` - User logout

### Credits
- POST `/api/credits/request` - Request credit purchase
- GET `/api/credits/requests` - Get credit requests (admin)
- POST `/api/credits/approve/:userId` - Approve credit request (admin)

### Admin
- GET `/api/admin/users` - Get all users
- POST `/api/admin/users/:userId/role` - Update user role
- POST `/api/admin/credits/send` - Send credits to user

### Collections
- GET `/api/collections` - Get user collections
- POST `/api/collections` - Create collection
- PUT `/api/collections/:id` - Update collection
- DELETE `/api/collections/:id` - Delete collection

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```env
PORT=3005
MONGODB_URI=mongodb://localhost:27017/ai-image-generator
JWT_SECRET=your-secret-key
```

3. Start the server:
```bash
npm start
```

## Future Enhancements
1. Real-time notifications for credit approvals
2. Advanced collection sharing features
3. Bulk image generation capabilities
4. Integration with multiple AI image generation services
5. Enhanced analytics and reporting
6. Social features and user interactions

## Contributing
Please read our contributing guidelines before submitting pull requests.