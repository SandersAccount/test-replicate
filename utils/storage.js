import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define storage directory relative to project root
export const STORAGE_DIR = path.join(__dirname, '..', 'public', 'storage', 'images');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Downloads and saves an image from a URL
 * @param {string} imageUrl - The URL of the image to download
 * @returns {Promise<{filePath: string, fileName: string, publicUrl: string}>} The path where the image was saved
 */
export async function saveImageFromUrl(imageUrl) {
    try {
        console.log('Downloading image from:', imageUrl);
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        
        const buffer = await response.arrayBuffer();
        
        // Create a unique filename using timestamp and random string
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const filename = `${timestamp}-${randomString}.webp`;
        
        const filePath = path.join(STORAGE_DIR, filename);
        
        // Save the file
        await fs.promises.writeFile(filePath, Buffer.from(buffer));
        
        console.log('Image saved successfully:', filePath);

        // Return both the file path and the public URL
        const publicUrl = `${process.env.PUBLIC_URL}/storage/images/${filename}`;
        return {
            filePath,
            fileName: filename,
            publicUrl
        };
    } catch (error) {
        console.error('Error saving image:', error);
        throw error;
    }
}

/**
 * Deletes an image file
 * @param {string} fileName - The name of the file to delete
 * @returns {Promise<void>}
 */
export async function deleteImage(fileName) {
    try {
        const filePath = path.join(STORAGE_DIR, fileName);
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            console.log('Image deleted successfully:', filePath);
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
}

/**
 * Gets the public URL for an image
 * @param {string} fileName - The name of the image file
 * @returns {string} The public URL for the image
 */
export function getImagePublicUrl(fileName) {
    return `${process.env.PUBLIC_URL}/storage/images/${fileName}`;
}
