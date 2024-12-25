import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    nickname: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        trim: true
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'pro'],
            default: 'free'
        },
        startDate: Date,
        endDate: Date,
        status: {
            type: String,
            enum: ['active', 'expired', 'cancelled'],
            default: 'active'
        }
    },
    credits: {
        balance: {
            type: Number,
            default: 0
        },
        history: [{
            amount: Number,
            type: {
                type: String,
                enum: ['purchase', 'usage', 'bonus'],
            },
            description: String,
            date: {
                type: Date,
                default: Date.now
            }
        }]
    },
    collections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection'
    }],
    generations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Generation'
    }],
    isAdmin: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
