import mongoose from 'mongoose';

const styleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    prompt: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
styleSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export const StyleModel = mongoose.model('Style', styleSchema);
