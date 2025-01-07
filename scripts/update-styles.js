import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Style from '../models/Style.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const styles = [
    {
        name: "No Style",
        prompt: "",
        imageUrl: "/images/no-style.png",
        order: 0
    },
    {
        name: "3D Pixar",
        prompt: "The style is 3D Pixar.",
        imageUrl: "/images/3d-pixar.png",
        order: 1
    },
    {
        name: "Apocaliptic",
        prompt: "The style is apocalyptic.",
        imageUrl: "/images/apocalyptic.png",
        order: 2
    },
    {
        name: "Cartoon",
        prompt: "The style is cartoon.",
        imageUrl: "/images/cartoon.png",
        order: 3
    },
    {
        name: "Disney",
        prompt: "The style is Disney.",
        imageUrl: "/images/disney.png",
        order: 4
    },
    {
        name: "Drawing",
        prompt: "The style is drawing.",
        imageUrl: "/images/drawing.png",
        order: 5
    },
    {
        name: "Kawaii",
        prompt: "The style is kawaii.",
        imageUrl: "/images/kawaii.png",
        order: 6
    },
    {
        name: "Minimalist",
        prompt: "The style is minimalist.",
        imageUrl: "/images/minimalist.png",
        order: 7
    },
    {
        name: "Retro",
        prompt: "The style is retro.",
        imageUrl: "/images/retro.png",
        order: 8
    },
    {
        name: "Vectors",
        prompt: "The style is vectors.",
        imageUrl: "/images/vectors.png",
        order: 9
    }
];

async function updateStyles() {
    try {
        for (const style of styles) {
            await Style.findOneAndUpdate(
                { name: style.name },
                { 
                    $set: {
                        prompt: style.prompt,
                        imageUrl: style.imageUrl,
                        order: style.order
                    }
                },
                { upsert: true }
            );
            console.log(`Updated style: ${style.name}`);
        }
        console.log('All styles updated successfully');
    } catch (error) {
        console.error('Error updating styles:', error);
    } finally {
        mongoose.disconnect();
    }
}

updateStyles();
