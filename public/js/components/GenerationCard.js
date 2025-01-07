import { CollectionSelector } from './CollectionSelector.js';

export class GenerationCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._imageUrl = '';
        this._prompt = '';
        this.render();
    }

    static get observedAttributes() {
        return ['image-url', 'prompt'];
    }

    connectedCallback() {
        this.setupEventListeners();
        this.checkAndRemoveDuplicate();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'image-url') this._imageUrl = newValue;
            if (name === 'prompt') this._prompt = newValue;
            this.render();
            if (name === 'image-url') this.checkAndRemoveDuplicate();
        }
    }

    checkAndRemoveDuplicate() {
        if (!this._imageUrl) return;
        
        // Get all generation cards
        const allCards = document.querySelectorAll('generation-card');
        const currentIndex = Array.from(allCards).indexOf(this);
        
        // Check for duplicates before this card
        allCards.forEach((card, index) => {
            if (index !== currentIndex && 
                card.getAttribute('image-url') === this._imageUrl) {
                // If this is a newer card (higher index), remove the old one
                if (currentIndex > index) {
                    card.remove();
                }
            }
        });
    }

    getImageData() {
        return {
            imageUrl: this._imageUrl,
            prompt: this._prompt,
            timestamp: new Date().toISOString()
        };
    }

    render() {
        const imageUrl = this.getAttribute('image-url');
        const prompt = this.getAttribute('prompt');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    transition: opacity 0.3s ease-out;
                }

                :host([hidden]) {
                    display: none;
                }

                .card {
                    background: #1E1E1E;
                    border-radius: 12px;
                    overflow: hidden;
                    position: relative;
                }

                .image-container {
                    position: relative;
                    width: 100%;
                    padding-bottom: 100%;
                }

                img {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .image-options-dropdown {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 4px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .image-container:hover .image-options-dropdown {
                    opacity: 1;
                }

                .dropdown-button {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 4px 8px;
                    font-size: 1.2rem;
                }

                .dropdown-content {
                    display: none;
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: #2a2a2a;
                    border-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    z-index: 1000;
                    min-width: 160px;
                }

                .dropdown-content.show {
                    display: block;
                }

                .dropdown-content div {
                    padding: 8px 16px;
                    cursor: pointer;
                    white-space: nowrap;
                    color: white;
                }

                .dropdown-content div:hover {
                    background: #3a3a3a;
                }

                .dropdown-content div[data-action="move-to-trash"] {
                    color: #ff4444;
                }
            </style>
            <div class="card">
                <div class="image-container">
                    <img src="${imageUrl}" alt="${prompt}" loading="lazy">
                    <div class="image-options-dropdown">
                        <button class="dropdown-button">⋮</button>
                        <div class="dropdown-content">
                            <div data-action="prompt">Show Prompt</div>
                            <div data-action="add-to-collection">Add to Collection</div>
                            <div data-action="download">Download</div>
                            <div data-action="upscale">Upscale</div>
                            <div data-action="move-to-trash">Move to Trash</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const dropdownButton = this.shadowRoot.querySelector('.dropdown-button');
        const dropdownContent = this.shadowRoot.querySelector('.dropdown-content');

        if (!dropdownButton || !dropdownContent) {
            console.error('Dropdown elements not found');
            return;
        }

        // Toggle dropdown
        dropdownButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Dropdown button clicked'); // Debug log
            dropdownContent.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.shadowRoot.contains(e.target)) {
                dropdownContent.classList.remove('show');
            }
        });

        // Add click listeners for dropdown options
        const options = this.shadowRoot.querySelectorAll('.dropdown-content div');
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = option.getAttribute('data-action');
                console.log('Option clicked:', action); // Debug log

                switch (action) {
                    case 'prompt':
                        this.handlePrompt();
                        break;
                    case 'add-to-collection':
                        this.handleAddToCollection();
                        break;
                    case 'download':
                        this.handleDownload();
                        break;
                    case 'upscale':
                        this.handleUpscale();
                        break;
                    case 'move-to-trash':
                        this.handleMoveToTrash();
                        break;
                }

                dropdownContent.classList.remove('show');
            });
        });
    }

    handlePrompt() {
        // Extract the base prompt without the style
        const fullPrompt = this.getAttribute('prompt');
        
        // Don't show "No prompt available" in the toast
        if (fullPrompt === 'No prompt available') {
            const toast = document.createElement('toast-notification');
            document.body.appendChild(toast);
            toast.show('No prompt available', 'info', 3000);
            return;
        }

        const styleIndex = fullPrompt.toLowerCase().indexOf('style:');
        const basePrompt = styleIndex !== -1 ? fullPrompt.substring(0, styleIndex).trim() : fullPrompt;
        
        // Create and show toast
        const toast = document.createElement('toast-notification');
        document.body.appendChild(toast);
        toast.show(basePrompt, 'info', 3000, 'Prompt:'); // Show with "Prompt:" title
    }

    handleAddToCollection() {
        console.log('Add to Collection selected');
        // Add your Add to Collection handling logic here (likely involves opening the modal)
        const modal = document.querySelector('collection-modal');
        if (modal) {
            // Set the current image data
            modal.setImageData(this.getImageData());
            modal.show();
        }
    }

    async handleDownload() {
        try {
            const imageUrl = this.getAttribute('image-url');
            const prompt = this.getAttribute('prompt');
            
            // Create filename from prompt or use timestamp
            let filename = prompt 
                ? prompt.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-') // Replace special chars with hyphens
                    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
                    .substring(0, 50) // Limit length
                : `image-${new Date().getTime()}`;
            
            filename = `${filename}.png`;

            // Create a temporary canvas to convert the image
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Enable CORS
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Convert to PNG and download
                canvas.toBlob(async (blob) => {
                    // Create download link
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = filename;
                    
                    // Trigger download
                    document.body.appendChild(link);
                    link.click();
                    
                    // Clean up
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);

                    // Show success toast
                    const toast = document.createElement('toast-notification');
                    document.body.appendChild(toast);
                    toast.show('Image downloaded successfully', 'success', 3000);
                }, 'image/png');
            };

            // Handle load errors
            img.onerror = () => {
                throw new Error('Failed to load image');
            };

            // Start loading the image
            img.src = imageUrl;
            
        } catch (error) {
            console.error('Error downloading image:', error);
            const toast = document.createElement('toast-notification');
            document.body.appendChild(toast);
            toast.show('Failed to download image', 'error', 3000);
        }
    }

    handleUpscale() {
        console.log('Upscale selected');
        // Add your upscale handling logic here
    }

    handleMoveToTrash() {
        console.log('handleMoveToTrash called'); // Debug log
        const isInCollection = this.hasAttribute('collection-id');

        if (isInCollection) {
            // If in collection, remove from collection
            const collectionId = this.getAttribute('collection-id');
            const imageId = this.getAttribute('image-id');
            
            fetch(`/api/collections/${collectionId}/images/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to remove from collection');
                this.setAttribute('hidden', '');
                const toast = document.createElement('toast-notification');
                document.body.appendChild(toast);
                toast.show('Image removed from collection', 'success', 3000);
            })
            .catch(error => {
                console.error('Error:', error);
                const toast = document.createElement('toast-notification');
                document.body.appendChild(toast);
                toast.show('Failed to remove from collection', 'error', 3000);
            });
        } else {
            // If in recent generations, just hide the card
            console.log('Hiding card from recent generations'); // Debug log
            this.setAttribute('hidden', '');
            const toast = document.createElement('toast-notification');
            document.body.appendChild(toast);
            toast.show('Image removed from recent generations', 'success', 3000);
        }
    }
}

customElements.define('generation-card', GenerationCard);

// Listen for collection creation to add pending image
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('collectionCreated', async (e) => {
        const pendingGenerationId = window.localStorage.getItem('pendingGenerationId');
        if (pendingGenerationId && e.detail.collection) {
            try {
                await fetch(`/api/collections/${e.detail.collection._id}/images`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ generationId: pendingGenerationId })
                });
                window.localStorage.removeItem('pendingGenerationId');
            } catch (error) {
                console.error('Error adding image to new collection:', error);
            }
        }
    });
});
