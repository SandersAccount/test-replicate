import express from 'express';
import { ImageGenerationService } from '../services/imageGeneration.js';
import { StyleService } from '../services/styleService.js';

const router = express.Router();
const styleService = new StyleService();
const imageGenerationService = new ImageGenerationService(process.env.REPLICATE_API_TOKEN);

// Image Generation Routes
router.post('/generate', async (req, res) => {
    try {
        const { prompt, styleId } = req.body;
        let style = null;
        
        if (styleId && styleId !== 'none') {
            style = await styleService.getStyleById(styleId);
        }

        const generation = await imageGenerationService.generateImage(prompt, style);
        res.json({ 
            generation,
            remainingCredits: 100
        });
    } catch (error) {
        console.error('Error in generate endpoint:', error);
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Style Routes
router.get('/styles', async (req, res) => {
    try {
        const styles = await styleService.getAllStyles();
        res.json(styles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/styles', async (req, res) => {
    try {
        const style = await styleService.createStyle(req.body);
        res.status(201).json(style);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/styles/:id', async (req, res) => {
    try {
        const style = await styleService.updateStyle(req.params.id, req.body);
        res.json(style);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/styles/:id', async (req, res) => {
    try {
        await styleService.deleteStyle(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
