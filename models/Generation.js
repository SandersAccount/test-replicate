import mongoose from 'mongoose';

const generationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    prompt: {
        type: String,
        required: true
    },
    imageData: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    settings: {
        type: Object,
        default: {}
    },
    collectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    metadata: {
        size: String,
        format: String,
        credits: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
generationSchema.index({ userId: 1, createdAt: -1 });

const Generation = mongoose.model('Generation', generationSchema);
export default Generation;
