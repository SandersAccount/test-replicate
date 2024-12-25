import { createCollectionCard, createNewCollectionCard } from '../components/CollectionCard.js';
import { setupCollectionModal, showCollectionModal } from '../components/CollectionModal.js';
import { createGenerationCard } from '../components/GenerationCard.js';

export class CollectionsPage {
    constructor() {
        this.setupEventListeners();
        this.initialize();
    }

    setupEventListeners() {
        // Listen for collection creation
        window.addEventListener('collectionCreated', () => {
            this.loadCollections();
        });

        // Listen for adding to collection
        window.addEventListener('imageAddedToCollection', () => {
            this.loadCollections();
        });

        // Listen for adding to collection
        window.addEventListener('addToCollection', (e) => {
            const generation = e.detail.generation;
            // Show collection selection UI
            console.log('Add to collection:', generation);
        });
    }

    async initialize() {
        setupCollectionModal();
        await Promise.all([
            this.loadCollections(),
            this.loadGenerations()
        ]);
    }

    async loadCollections() {
        try {
            const response = await fetch('/api/collections', {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to load collections');
            
            const collections = await response.json();
            this.displayCollections(collections);
        } catch (error) {
            console.error('Error loading collections:', error);
        }
    }

    displayCollections(collections) {
        const grid = document.getElementById('collectionsGrid');
        grid.innerHTML = '';

        // Add "Create New Collection" card
        const newCollectionCard = createNewCollectionCard(() => {
            showCollectionModal();
        });
        grid.appendChild(newCollectionCard);

        // Add existing collections
        collections.forEach(collection => {
            const card = createCollectionCard(collection);
            grid.appendChild(card);
        });
    }

    async loadGenerations() {
        try {
            const response = await fetch('/api/generations', {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to load generations');
            
            const generations = await response.json();
            this.displayGenerations(generations);
        } catch (error) {
            console.error('Error loading generations:', error);
        }
    }

    displayGenerations(generations) {
        const grid = document.getElementById('generationsGrid');
        grid.innerHTML = '';

        generations.forEach(generation => {
            const card = createGenerationCard(generation);
            grid.appendChild(card);
        });
    }
}
