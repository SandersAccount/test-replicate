# Sticker Generator Project Rules
Every time you choose to apply a rule(s), explicitly state the rule(s) in the output. You can abbreviate the rule description to a single word or phrase.

## Project Context
The Sticker Generator is a web application that allows users to generate custom stickers using AI, organize them into collections, and manage their creations efficiently. The application integrates with the Replicate API for image generation and uses MongoDB for data persistence.

The project consists of:
- A sticker generation interface for creating custom stickers
- A collections system for organizing generated stickers
- A credits system for managing user generation limits
- A modern, responsive UI with dark theme
- User authentication and role-based access control
- Admin dashboard for user and credit management
- Integration with AI image generation services

## Key Features and Implementation Details

### Authentication System
- JWT-based authentication with secure cookie storage
- Role-based access control (user/admin)
- Protected routes requiring authentication via middleware
- User model with integrated credit system
- Admin authorization middleware for protected routes

### Credits System
- Users start with 100 free credits
- Credit purchase functionality:
  ```javascript
  {
    credits: number, // 100-1000 in steps of 100
    status: 'pending' | 'approved' | 'rejected',
    requestedAt: Date,
    approvedAt?: Date,
    approvedBy?: ObjectId
  }
  ```
- Admin approval workflow for credit purchases
- Credit history tracking and expiration management
- Bulk purchase discounts (up to 20% for 1000 credits)

### Image Generation
- Utilizes Replicate API for AI image generation
- Implementation in `services/imageGenerator.js`
- Requires REPLICATE_API_TOKEN in environment variables
- Supports customizable image parameters:
  ```javascript
  {
    prompt: string,
    negative_prompt?: string,
    width: number,
    height: number
  }
  ```
- **Prompts**
  - Users can enter natural language prompts to describe the image they want to generate
  - Prompts should be clear and descriptive
  - The system automatically enhances prompts with style-specific additions when a style is selected
- **Styles**
  The application includes several pre-defined styles that users can choose from:
  1. **No Style** (Default)
     - No additional prompt modifications
     - Allows pure user prompt to be used
  2. **3D Pixar**
     - Thumbnail: Cute animated character
     - Prompt Addition: "3D render in the style of Pixar animation, cute and appealing, high quality, detailed, volumetric lighting"
     - Best for: Character designs and cute animations
  3. **Apocaliptic**
     - Thumbnail: Post-apocalyptic scene
     - Prompt Addition: "post-apocalyptic setting, dystopian atmosphere, ruins, survival elements, dramatic lighting"
     - Best for: Dystopian and post-apocalyptic scenes
  4. **Cartoon**
     - Thumbnail: Cartoon character
     - Prompt Addition: "2D cartoon style, vibrant colors, clean lines, animated look"
     - Best for: Simple, expressive illustrations
  5. **Disney**
     - Thumbnail: Disney-style character
     - Prompt Addition: "Disney animation style, magical, whimsical, expressive characters"
     - Best for: Family-friendly character designs
  6. **Drawing**
     - Thumbnail: Hand-drawn artwork
     - Prompt Addition: "hand-drawn illustration, sketchy lines, artistic, traditional media look"
     - Best for: Artistic and sketch-like images
  7. **Kawaii**
     - Thumbnail: Cute Japanese-style character
     - Prompt Addition: "kawaii style, cute, adorable, pastel colors, chibi"
     - Best for: Cute and Japanese-inspired designs
  8. **Minimalist**
     - Thumbnail: Simple geometric design
     - Prompt Addition: "minimalist design, simple shapes, clean lines, limited color palette"
     - Best for: Clean and simple designs
- **Style Selection Process**
  1. Users can select a style from the style carousel
  2. The selected style is highlighted with a green border
  3. When generating an image, the system:
     - Takes the user's input prompt
     - Combines it with the selected style's prompt addition
     - Sends the combined prompt to the image generation API
- **Prompt Combination Example**
  ```
  User Prompt: "a cute cat"
  Selected Style: 3D Pixar
  Final Prompt: "a cute cat. 3D render in the style of Pixar animation, cute and appealing, high quality, detailed, volumetric lighting"
  ```

### Collections System
- MongoDB schema in `models/Collection.js`
- Collections contain:
  ```javascript
  {
    userId: ObjectId,
    title: string,
    createdAt: Date,
    updatedAt: Date,
    privacy: 'public' | 'private'
  }
  ```
- Generations are linked to collections via `collectionId`
- Collection sharing and privacy settings

### Frontend Structure
- Pages:
  - `/` - Landing page and sticker generation
  - `/collections` - Collections management
  - `/profile` - User profile and credits
  - `/admin` - Admin dashboard (admin only)
- Components:
  - `topbar.js` - Navigation and user interface
  - `credits-popup.js` - Credit purchase interface
  - `collection-manager.js` - Collection operations

### Database Models

#### User Model
```javascript
{
  name: string,
  email: string,
  password: string, // hashed
  role: 'user' | 'admin',
  credits: number,
  creditRequests: [{
    credits: number,
    status: string,
    requestedAt: Date,
    approvedAt: Date,
    approvedBy: ObjectId
  }],
  subscription: {
    plan: string,
    status: string,
    startDate: Date,
    endDate: Date
  }
}
```

#### Collection Model
```javascript
{
  userId: ObjectId,
  title: string,
  privacy: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Environment Setup
Required environment variables:
```
MONGODB_URI=mongodb://localhost:27017/sticker-generator
REPLICATE_API_TOKEN=your_replicate_token
JWT_SECRET=your_jwt_secret
PORT=3005
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

#### Credits
- `POST /api/credits/request` - Request credit purchase
- `GET /api/credits/requests` - Get credit requests (admin)
- `POST /api/credits/approve/:userId` - Approve credit request (admin)

#### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users/:userId/role` - Update user role
- `POST /api/admin/credits/send` - Send credits to user

#### Collections
- `GET /api/collections` - Get user collections
- `POST /api/collections` - Create collection
- `PUT /api/collections/:id` - Update collection
- `DELETE /api/collections/:id` - Delete collection

### Security Features
- Password hashing with bcrypt
- JWT token management
- Protected API endpoints
- Role-based access control
- CORS configuration
- Input validation and sanitization

### Project Structure
```
test-replicate/
├── config/
│   ├── database.js     # MongoDB configuration
│   └── plans.js        # Subscription plans
├── middleware/
│   ├── auth.js         # Authentication middleware
│   └── adminAuth.js    # Admin authorization
├── models/
│   └── User.js         # User model with credits
├── public/
│   ├── js/
│   │   ├── topbar.js   # Navigation
│   │   └── utils.js    # Shared utilities
│   └── styles.css      # Global styles
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── admin.js        # Admin routes
│   ├── credits.js      # Credit system
│   └── subscription.js # Subscription management
├── views/
│   ├── admin.html      # Admin dashboard
│   ├── profile.html    # User profile
│   ├── collections.html# Collections
│   └── index.html      # Landing page
└── server.js           # Main application
```

### Error Handling
```javascript
try {
    const response = await fetch('/api/collections');
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load collections');
    }
    const collections = await response.json();
    // Handle success
} catch (error) {
    console.error('Error:', error);
    showErrorMessage(error.message);
}
```

### Development Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start MongoDB
5. Run server: `npm start`

### Common Issues and Solutions
1. Credit System Issues
   - Check user role permissions
   - Verify credit request format
   - Ensure admin approval flow

2. Authentication Problems
   - Check JWT token expiration
   - Verify cookie settings
   - Check role-based access

3. Performance Optimization
   - Implement request caching
   - Use pagination for lists
   - Optimize database queries

## Recent Updates (December 26, 2024)

### Credit System Implementation
- Added credit purchase workflow
- Implemented admin approval system
- Added bulk purchase discounts
- Integrated credit history tracking

### Security Enhancements
- Added role-based access control
- Implemented protected routes
- Enhanced error handling
- Added input validation

### UI Improvements
- Added responsive top navigation
- Implemented credit purchase modal
- Enhanced admin dashboard
- Added user profile page
