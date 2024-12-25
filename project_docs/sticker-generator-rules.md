# Sticker Generator Project Rules
Every time you choose to apply a rule(s), explicitly state the rule(s) in the output. You can abbreviate the rule description to a single word or phrase.

## Project Context
The Sticker Generator is a web application that allows users to generate custom stickers using AI, organize them into collections, and manage their creations efficiently. The application integrates with the Replicate API for image generation and uses MongoDB for data persistence.

The project consists of:
- A sticker generation interface for creating custom stickers
- A collections system for organizing generated stickers
- A modern, responsive UI with dark theme
- User authentication and session management
- Integration with AI image generation services

## Key Features and Implementation Details

### Authentication System
- Uses SaaS Core authentication middleware
- User sessions are managed through `saas-core/middleware/auth.js`
- Protected routes require authentication via `saasCore.middleware.auth`
- User model is defined in `saas-core/models/User.js`

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

### Collections System
- MongoDB schema in `models/Collection.js`
- Collections contain:
  ```javascript
  {
    userId: ObjectId,
    title: string,
    createdAt: Date,
    updatedAt: Date
  }
  ```
- Generations are linked to collections via `collectionId`
- API endpoints:
  - POST `/api/collections` - Create collection
  - GET `/api/collections` - List user's collections
  - POST `/api/collections/:collectionId/images` - Add image to collection

### Frontend Structure
- Pages:
  - `/` - Sticker generation interface
  - `/collections` - Collections management
- Components:
  - `CollectionCard.js` - Displays collection with image grid
  - `CollectionModal.js` - New collection creation
  - `GenerationCard.js` - Individual generated image
  - `Topbar.js` - Navigation and user interface

### Database Models

#### Generation Model
```javascript
{
  userId: ObjectId,
  prompt: string,
  imageData: string, // Base64 encoded image
  collectionId: ObjectId,
  createdAt: Date
}
```

#### Collection Model
```javascript
{
  userId: ObjectId,
  title: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Environment Setup
Required environment variables:
```
MONGODB_URI=mongodb://localhost:27017/sticker-generator
REPLICATE_API_TOKEN=your_replicate_token
PORT=3000
```

### API Endpoints

#### Collections
- `GET /api/collections`
  - Returns user's collections with recent images
  - Requires authentication
  - Response includes up to 3 recent images per collection

- `POST /api/collections`
  - Creates new collection
  - Requires: `{ title: string }`
  - Returns created collection object

- `POST /api/collections/:collectionId/images`
  - Adds generated image to collection
  - Requires: `{ generationId: string }`

#### Generations
- `POST /api/generate`
  - Generates new sticker
  - Requires: `{ prompt: string }`
  - Returns: `{ imageData: string }`

- `GET /api/generations`
  - Returns user's recent generations
  - Sorted by creation date
  - Includes base64 image data

### Event System
Frontend components communicate through custom events:
```javascript
// Collection creation
window.dispatchEvent(new CustomEvent('collectionCreated', { 
    detail: { collection } 
}));

// Adding to collection
window.dispatchEvent(new CustomEvent('addToCollection', { 
    detail: { generation } 
}));
```

### CSS Structure
- Uses CSS Grid for layouts
- Dark theme colors:
  ```css
  :root {
    --background: #1a1a1a;
    --card-bg: #2a2a2a;
    --text: #ffffff;
    --text-secondary: #888888;
    --primary: #007bff;
    --error: #dc3545;
  }
  ```

### Error Handling Patterns
```javascript
try {
    const response = await fetch('/api/collections');
    if (!response.ok) throw new Error('Failed to load collections');
    
    const collections = await response.json();
    // Handle success
} catch (error) {
    console.error('Error:', error);
    // Show user-friendly error message
}
```

### Development Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start MongoDB
5. Run development server: `npm start`

### Common Issues and Solutions
1. Image Generation Failures
   - Check Replicate API token
   - Verify user authentication
   - Check prompt length and content

2. Collection Loading Issues
   - Verify MongoDB connection
   - Check user authentication
   - Verify correct user ID in queries

3. Performance Considerations
   - Images are stored as base64
   - Limit number of images per request
   - Implement pagination for large collections

## Recent Updates (December 22, 2024)

### Image Generation Service Updates

#### Replicate API Integration
- Updated to use the `fofr/sticker-maker` model version `4acb778eb059772225ec213948f0660867b2e03f277448f18cf1800b96a65a1a`
- Enhanced error handling and validation for API responses
- Added connection testing before image generation
- Improved logging for debugging API issues

```javascript
// Model Configuration
{
    steps: 17,
    width: 1152,
    height: 1152,
    output_format: "png",
    output_quality: 100,
    negative_prompt: "",
    number_of_images: 1
}
```

#### Image Storage and Organization

##### Folder Structure
```
/uploads
  ├── /stickers           # Generated sticker images
  │   ├── /user_{id}     # User-specific sticker folders
  │   └── /shared        # Publicly shared stickers
  ├── /collections       # User collections
  │   └── /user_{id}     # User-specific collection folders
  └── /temp             # Temporary storage for processing
```

##### Image Handling Rules
1. **Storage Location**
   - Generated stickers are saved in user-specific folders
   - Collection images are organized by user and collection ID
   - Temporary files are automatically cleaned up after 24 hours

2. **File Naming**
   - Format: `{timestamp}_{user_id}_{prompt_hash}.{extension}`
   - Example: `20241222_123456_user123_abc123.png`

3. **Access Control**
   - Private stickers: Only accessible to the creator
   - Shared stickers: Available in the public gallery
   - Collection images: Access based on collection sharing settings

### User Interface Updates

#### Popup System
1. **Generation Progress**
   ```html
   <div class="popup progress-popup">
     <div class="progress-bar"></div>
     <div class="status-message">Generating your sticker...</div>
   </div>
   ```

2. **Error Messages**
   ```html
   <div class="popup error-popup">
     <div class="error-icon">⚠️</div>
     <div class="error-message"></div>
     <div class="error-details"></div>
   </div>
   ```

3. **Success Feedback**
   ```html
   <div class="popup success-popup">
     <div class="success-icon">✓</div>
     <div class="success-message"></div>
     <div class="action-buttons">
       <button class="share-button">Share</button>
       <button class="download-button">Download</button>
     </div>
   </div>
   ```

#### Popup Behavior
1. **Display Rules**
   - Only one popup visible at a time
   - Auto-dismiss after 5 seconds for success messages
   - Error popups require user dismissal
   - Progress popups stay until operation completes

2. **Animation**
   - Fade in/out transitions
   - Smooth progress bar updates
   - Gentle bounce effect for new popups

3. **Responsive Design**
   - Centered on desktop
   - Bottom-anchored on mobile
   - Adjusts width based on content

### Error Handling

#### API Errors
1. **Authentication**
   - 401/403: Invalid or expired API token
   - 429: Rate limit exceeded
   - 500: Server-side generation error

2. **User Feedback**
   - Clear error messages with suggested actions
   - Option to retry failed generations
   - Contact support link for persistent issues

3. **Error Recovery**
   - Automatic retry for temporary failures
   - Graceful fallback for unsupported features
   - Session persistence for incomplete operations

### Collection Management

#### Organization Features
1. **Folder Views**
   - Grid layout for collections
   - List view with details
   - Sorting options (date, name, size)

2. **Batch Operations**
   - Multi-select stickers
   - Bulk move/copy between collections
   - Batch sharing options

3. **Search and Filter**
   - Search by prompt text
   - Filter by date range
   - Tag-based filtering

### Environment Configuration

```env
# API Configuration
REPLICATE_API_TOKEN=your_token_here

# Storage Settings
UPLOAD_DIR=/uploads
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_TYPES=["png", "webp"]

# Cache Configuration
CACHE_DURATION=86400    # 24 hours
TEMP_CLEANUP_INTERVAL=3600  # 1 hour
```

### Future Considerations
1. **Performance Optimization**
   - Image compression options
   - Lazy loading for galleries
   - Client-side caching

2. **Feature Roadmap**
   - Batch generation support
   - Custom style presets
   - Advanced editing tools

3. **Security Enhancements**
   - Rate limiting per user
   - Watermarking options
   - Enhanced access controls

## Code Style and Structure
Write clean, modular JavaScript code with clear component separation
Use ES6+ features and modern JavaScript patterns
Implement proper error handling and user feedback
Structure repository files as follows:

```
test-replicate/
├── public/
│   ├── js/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── CollectionCard.js
│   │   │   ├── CollectionModal.js
│   │   │   ├── GenerationCard.js
│   │   │   └── Topbar.js
│   │   └── pages/         # Page-specific logic
│   │       └── CollectionsPage.js
│   ├── styles.css         # Global styles
│   └── images/           # Static images
├── models/               # Database models
│   ├── Collection.js
│   └── Generation.js
├── services/            # Business logic
│   └── imageGenerator.js
├── middleware/          # Express middleware
│   └── auth.js
├── saas-core/          # Core functionality
│   ├── models/
│   ├── middleware/
│   └── index.js
└── server.js           # Main application entry
```

## Tech Stack
- Express.js (Backend)
- MongoDB (Database)
- Vanilla JavaScript (Frontend)
- Replicate API (AI Image Generation)
- CSS3 (Styling)

## Naming Conventions
- Use camelCase for JavaScript functions and variables
- Use PascalCase for component files
- Use descriptive names that indicate purpose
- Prefix event handlers with 'handle' (e.g., handleSubmit)
- Suffix callbacks with 'Callback' (e.g., onClickCallback)

## JavaScript Usage
- Use ES6+ features (arrow functions, destructuring, etc.)
- Implement proper async/await patterns
- Use event-driven architecture for component communication
- Implement proper error handling with try/catch
- Use module pattern for code organization

## Component Structure
Components should:
- Be self-contained and reusable
- Handle their own state and events
- Use event delegation when appropriate
- Follow single responsibility principle
- Implement proper cleanup for event listeners

## State Management
- Use events for cross-component communication
- Implement proper data fetching patterns
- Handle loading and error states
- Use proper state persistence with MongoDB
- Implement proper cleanup in async operations

## API Integration
- Handle Replicate API calls properly
- Implement proper error handling for API calls
- Use proper authentication headers
- Handle rate limiting and quotas
- Implement proper retry mechanisms

## UI and Styling
- Use CSS Grid for layout
- Implement responsive design
- Follow dark theme color scheme
- Use CSS variables for theming
- Implement proper loading states
- Handle empty states gracefully

## Error Handling
- Implement proper error boundaries
- Show user-friendly error messages
- Log errors appropriately
- Handle network failures gracefully
- Implement proper fallbacks

## Security
- Implement proper authentication
- Sanitize user inputs
- Handle file uploads securely
- Implement proper CORS policies
- Protect sensitive routes

## Git Usage
Commit Message Prefixes:
- "feat:" for new features
- "fix:" for bug fixes
- "style:" for styling changes
- "refactor:" for code improvements
- "docs:" for documentation
- "chore:" for maintenance

Rules:
- Write clear commit messages
- Reference issue numbers
- Keep commits focused
- Use proper branching strategy
- Review code before merging

## Documentation
- Maintain clear README
- Document API endpoints
- Document component usage
- Keep code comments relevant
- Document environment setup

## Development Workflow
- Use proper version control
- Test thoroughly before deployment
- Follow code review process
- Update documentation regularly
- Maintain clean code practices

## Testing
- Test UI interactions
- Test API integrations
- Test error scenarios
- Test responsive design
- Test performance

## Performance
- Optimize image loading
- Minimize API calls
- Use proper caching
- Optimize database queries
- Monitor memory usage
