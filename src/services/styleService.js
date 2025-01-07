import { StyleModel } from '../models/Style.js';

export class StyleService {
    async getAllStyles() {
        try {
            const styles = await StyleModel.find().sort({ order: 1 });
            return styles;
        } catch (error) {
            console.error('Error fetching styles:', error);
            throw error;
        }
    }

    async createStyle(styleData) {
        try {
            const style = new StyleModel(styleData);
            await style.validate();
            return await style.save();
        } catch (error) {
            console.error('Error creating style:', error);
            throw error;
        }
    }

    async updateStyle(id, styleData) {
        try {
            const style = await StyleModel.findByIdAndUpdate(
                id,
                styleData,
                { new: true, runValidators: true }
            );
            if (!style) {
                throw new Error('Style not found');
            }
            return style;
        } catch (error) {
            console.error('Error updating style:', error);
            throw error;
        }
    }

    async deleteStyle(id) {
        try {
            const style = await StyleModel.findByIdAndDelete(id);
            if (!style) {
                throw new Error('Style not found');
            }
            return style;
        } catch (error) {
            console.error('Error deleting style:', error);
            throw error;
        }
    }
}
