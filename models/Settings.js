import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    logoUrl: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
