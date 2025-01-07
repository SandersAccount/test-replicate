import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const styles = [
    { name: 'No Style', filename: 'no-style.png', color: '#4CAF50' },
    { name: '3D Pixar', filename: '3d-pixar.png', color: '#2196F3' },
    { name: 'Apocaliptic', filename: 'apocalyptic.png', color: '#F44336' },
    { name: 'Cartoon', filename: 'cartoon.png', color: '#9C27B0' },
    { name: 'Disney', filename: 'disney.png', color: '#3F51B5' },
    { name: 'Drawing', filename: 'drawing.png', color: '#009688' },
    { name: 'Kawaii', filename: 'kawaii.png', color: '#E91E63' },
    { name: 'Minimalist', filename: 'minimalist.png', color: '#607D8B' },
    { name: 'Retro', filename: 'retro.png', color: '#FF9800' },
    { name: 'Vectors', filename: 'vectors.png', color: '#795548' }
];

async function generateStyleImage(style) {
    const canvas = createCanvas(80, 80);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = style.color;
    ctx.fillRect(0, 0, 80, 80);

    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Split name into words and draw each on a new line
    const words = style.name.split(' ');
    const lineHeight = 20;
    const startY = 40 - ((words.length - 1) * lineHeight) / 2;
    
    words.forEach((word, i) => {
        ctx.fillText(word, 40, startY + i * lineHeight);
    });

    // Save image
    const buffer = canvas.toBuffer('image/png');
    const outputPath = path.join(__dirname, '..', 'public', 'images', style.filename);
    await fs.promises.writeFile(outputPath, buffer);
    console.log(`Generated ${style.filename}`);
}

async function generateAllImages() {
    try {
        for (const style of styles) {
            await generateStyleImage(style);
        }
        console.log('All style images generated successfully');
    } catch (error) {
        console.error('Error generating style images:', error);
    }
}

generateAllImages();
