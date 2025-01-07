import { Toast } from './Toast.js';

export class CollectionModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.imageData = null;
        this.prompt = null;
        this.collections = [];
        this.isVisible = false;
        this._excludeCollectionId = null;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: none;
                }

                :host(.active) {
                    display: block;
                }

                .overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal {
                    background: #1E1E1E;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 400px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
                }

                .modal-header {
                    padding: 16px 20px;
                    font-size: 1.1rem;
                    font-weight: 500;
                    color: #fff;
                    border-bottom: 1px solid #333;
                }

                .collections-list {
                    padding: 12px;
                    max-height: 60vh;
                    overflow-y: auto;
                }

                .collection-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    color: #fff;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: background-color 0.2s;
                }

                .collection-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .collection-item.create-new {
                    color: #4A90E2;
                    margin-top: 8px;
                    border-top: 1px solid #333;
                    padding-top: 16px;
                }

                .collection-item.create-new i {
                    margin-right: 8px;
                }

                .image-count {
                    color: #666;
                    font-size: 0.9rem;
                }

                ::-webkit-scrollbar {
                    width: 8px;
                }

                ::-webkit-scrollbar-track {
                    background: #1E1E1E;
                }

                ::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 4px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: #444;
                }
            </style>
            <div class="overlay">
                <div class="modal">
                    <div class="modal-header">Save to Collection</div>
                    <div class="collections-list">
                        <!-- Collections will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        // Close on overlay click
        this.shadowRoot.querySelector('.overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('overlay')) {
                this.hide();
            }
        });
    }

    static get observedAttributes() {
        return ['exclude-collection'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'exclude-collection' && oldValue !== newValue) {
            this._excludeCollectionId = newValue;
            // Refresh collections list if modal is open
            if (this.isVisible) {
                this.fetchCollections();
            }
        }
    }

    async fetchCollections() {
        try {
            const response = await fetch('/api/collections');
            if (!response.ok) throw new Error('Failed to fetch collections');
            let collections = await response.json();

            // Filter out the excluded collection if one is set
            if (this._excludeCollectionId) {
                collections = collections.filter(c => c._id !== this._excludeCollectionId);
            }

            this.renderCollectionsList(collections);
        } catch (error) {
            console.error('Error fetching collections:', error);
            const toast = document.createElement('toast-notification');
            document.body.appendChild(toast);
            toast.show('Failed to load collections', 'error', 3000);
        }
    }

    async show() {
        if (!this.imageData) return; // Don't show if no image data
        this.isVisible = true;
        const overlay = this.shadowRoot.querySelector('.overlay');
        if (overlay) {
            this.style.display = 'block';
            overlay.style.display = 'flex';
        }
        this.fetchCollections(); // Fetch collections when showing the modal
    }

    hide() {
        this.isVisible = false;
        const overlay = this.shadowRoot.querySelector('.overlay');
        if (overlay) {
            this.style.display = 'none';
            overlay.style.display = 'none';
        }
        // Clear the exclude collection when hiding
        this._excludeCollectionId = null;
        this.removeAttribute('exclude-collection');
    }

    async loadCollections() {
        try {
            const response = await fetch('/api/collections');
            this.collections = await response.json();
            
            const listElement = this.shadowRoot.querySelector('.collections-list');
            listElement.innerHTML = this.collections.map(collection => `
                <div class="collection-item" data-id="${collection._id}">
                    <span>${collection.title}</span>
                    <span class="image-count">${collection.stats?.imageCount || 0} images</span>
                </div>
            `).join('') + `
                <div class="collection-item create-new">
                    <i class="fas fa-plus"></i>
                    <span>Create New Collection</span>
                </div>
            `;

            // Add click handlers
            this.shadowRoot.querySelectorAll('.collection-item:not(.create-new)').forEach(item => {
                item.addEventListener('click', () => this.addToCollection(item.dataset.id));
            });

            // Add create new handler
            this.shadowRoot.querySelector('.create-new').addEventListener('click', () => {
                this.showNewCollectionDialog();
            });
        } catch (error) {
            console.error('Error loading collections:', error);
        }
    }

    renderCollectionsList(collections) {
        const listElement = this.shadowRoot.querySelector('.collections-list');
        listElement.innerHTML = collections.map(collection => `
            <div class="collection-item" data-id="${collection._id}">
                <span>${collection.title}</span>
                <span class="image-count">${collection.stats?.imageCount || 0} images</span>
            </div>
        `).join('') + `
            <div class="collection-item create-new">
                <i class="fas fa-plus"></i>
                <span>Create New Collection</span>
            </div>
        `;

        // Add click handlers
        this.shadowRoot.querySelectorAll('.collection-item:not(.create-new)').forEach(item => {
            item.addEventListener('click', () => this.addToCollection(item.dataset.id));
        });

        // Add create new handler
        this.shadowRoot.querySelector('.create-new').addEventListener('click', () => {
            this.showNewCollectionDialog();
        });
    }

    async createNewCollection(title) {
        try {
            const response = await fetch('/api/collections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title })
            });

            if (!response.ok) {
                throw new Error('Failed to create collection');
            }

            // Reload collections and show modal
            await this.fetchCollections();
            this.show();
        } catch (error) {
            console.error('Error creating collection:', error);
            const toast = document.querySelector('toast-notification') || document.createElement('toast-notification');
            if (!toast.parentElement) {
                document.body.appendChild(toast);
            }
            toast.show('Failed to create collection', 'error');
        }
    }

    async addToCollection(collectionId) {
        try {
            console.log('Adding to collection:', {
                collectionId,
                imageData: this.imageData
            });

            const response = await fetch(`/api/collections/${collectionId}/images`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageUrl: this.imageData.imageUrl,
                    prompt: this.imageData.prompt
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add image to collection');
            }

            const result = await response.json();

            // Show success toast
            const toast = document.querySelector('toast-notification') || document.createElement('toast-notification');
            if (!toast.parentElement) {
                document.body.appendChild(toast);
            }
            toast.show('Image added to collection successfully!');

            // Hide modal
            this.hide();

            // Dispatch event for image added
            this.dispatchEvent(new CustomEvent('imageAddedToCollection', {
                detail: {
                    collectionId,
                    imageData: this.imageData,
                    collection: result.collection
                },
                bubbles: true,
                composed: true
            }));
        } catch (error) {
            console.error('Error adding image to collection:', error);
            const toast = document.querySelector('toast-notification') || document.createElement('toast-notification');
            if (!toast.parentElement) {
                document.body.appendChild(toast);
            }
            toast.show('Failed to add image to collection', 'error');
        }
    }

    setImageData(data) {
        this.imageData = data;
        console.log('Image data set:', data); // Debug log
    }

    showNewCollectionDialog() {
        const newCollectionModal = document.createElement('new-collection-modal');
        if (!newCollectionModal.parentElement) {
            document.body.appendChild(newCollectionModal);
        }
        newCollectionModal.showNewCollectionDialog();
    }
}

class NewCollectionModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: none;
                }

                :host(.active) {
                    display: block;
                }

                .overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal {
                    background: #1E1E1E;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 400px;
                    padding: 20px;
                }

                .modal-title {
                    color: #fff;
                    font-size: 1.2rem;
                    margin: 0 0 20px;
                }

                .input-group {
                    margin-bottom: 20px;
                }

                input {
                    width: 94%;
                    padding: 10px;
                    border: 1px solid #333;
                    border-radius: 6px;
                    background: #2a2a2a;
                    color: #fff;
                    font-size: 1rem;
                }

                input:focus {
                    outline: none;
                    border-color: #4CAF50;
                }

                .button-group {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }

                button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .create-btn {
                    background: #4CAF50;
                    color: white;
                }

                .create-btn:hover {
                    background: #45a049;
                }

                .cancel-btn {
                    background: transparent;
                    color: #999;
                }

                .cancel-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            </style>
            <div class="overlay">
                <div class="modal">
                    <h3 class="modal-title">Create New Collection</h3>
                    <div class="input-group">
                        <input type="text" id="collectionName" placeholder="Enter collection name">
                    </div>
                    <div class="button-group">
                        <button class="cancel-btn">Cancel</button>
                        <button class="create-btn">Create</button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const overlay = this.shadowRoot.querySelector('.overlay');
        const cancelBtn = this.shadowRoot.querySelector('.cancel-btn');
        const createBtn = this.shadowRoot.querySelector('.create-btn');
        const input = this.shadowRoot.querySelector('#collectionName');

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.hide();
        });

        cancelBtn.addEventListener('click', () => this.hide());

        createBtn.addEventListener('click', () => this.createCollection());

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createCollection();
        });
    }

    async createCollection() {
        const input = this.shadowRoot.querySelector('#collectionName');
        const name = input.value.trim();

        if (!name) {
            this.showToast('Please enter a collection name', 'error');
            return;
        }

        try {
            const response = await fetch('/api/collections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: name })
            });

            if (!response.ok) throw new Error('Failed to create collection');

            const collection = await response.json();
            this.showToast('Collection created successfully!', 'success');
            this.hide();
            
            // Dispatch event to notify collection creation
            window.dispatchEvent(new CustomEvent('collectionCreated', {
                detail: { collection }
            }));

            // Clear input
            input.value = '';
        } catch (error) {
            console.error('Error creating collection:', error);
            this.showToast('Failed to create collection', 'error');
        }
    }

    showNewCollectionDialog() {
        this.classList.add('active');
        const input = this.shadowRoot.querySelector('#collectionName');
        input.value = '';
        input.focus();
    }

    hide() {
        this.classList.remove('active');
    }

    showToast(message, type) {
        const toast = document.querySelector('toast-notification') || document.createElement('toast-notification');
        if (!toast.parentElement) {
            document.body.appendChild(toast);
        }
        toast.show(message, type);
    }
}

customElements.define('collection-modal', CollectionModal);
customElements.define('new-collection-modal', NewCollectionModal);
