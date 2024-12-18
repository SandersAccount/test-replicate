import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'pro'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'cancelled'],
            default: 'active'
        },
        stripeCustomerId: String,
        stripeSubscriptionId: String,
        currentPeriodEnd: Date
    },
    usage: {
        imagesGenerated: {
            type: Number,
            default: 0
        },
        savedPresets: {
            type: Number,
            default: 0
        }
    },
    lastLogin: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        console.log('Comparing passwords...');
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        console.log('Password match:', isMatch);
        return isMatch;
    } catch (error) {
        console.error('Password comparison error:', error);
        throw error;
    }
};

// Method to check if user can perform action based on plan
userSchema.methods.canPerformAction = function(action) {
    const limits = {
        free: {
            imagesPerMonth: 50,
            presetsLimit: 5
        },
        pro: {
            imagesPerMonth: 500,
            presetsLimit: 50
        }
    };

    const plan = this.subscription.plan;
    const usage = this.usage;

    switch(action) {
        case 'generateImage':
            return usage.imagesGenerated < limits[plan].imagesPerMonth;
        case 'savePreset':
            return usage.savedPresets < limits[plan].presetsLimit;
        default:
            return false;
    }
};

export default mongoose.model('User', userSchema);
