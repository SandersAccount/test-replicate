import Replicate from 'replicate';
import { saveImageFromUrl } from '../utils/storage.js';

export class ImageGenerationService {
    constructor(apiToken) {
        this.replicate = new Replicate({
            auth: apiToken
        });
    }

    async generateImage(prompt, style = null) {
        try {
            const finalPrompt = this.buildPrompt(prompt, style);
            console.log('Generating image with prompt:', finalPrompt);

            const output = await this.replicate.run(
                "fofr/sticker-maker:4acb778eb059772225ec213948f0660867b2e03f277448f18cf1800b96a65a1a",
                {
                    input: {
                        prompt: finalPrompt,
                        steps: 17,
                        width: 1152,
                        height: 1152,
                        output_format: "png",
                        output_quality: 100,
                        negative_prompt: "ugly, blurry, poor quality, distorted",
                        number_of_images: 1
                    }
                }
            );

            if (!output || !output[0]) {
                throw new Error('No image generated');
            }

            const { filePath } = await saveImageFromUrl(output[0]);

            return {
                imageUrl: filePath,
                prompt: finalPrompt,
                createdAt: new Date()
            };

        } catch (error) {
            console.error('Error generating image:', error);
            throw error;
        }
    }

    buildPrompt(userPrompt, style) {
        if (!style || !style.prompt) {
            return userPrompt;
        }
        return `${userPrompt}. ${style.prompt}`;
    }
}
