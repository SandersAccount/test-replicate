document.addEventListener('DOMContentLoaded', () => {
    createTopbar(); 
    loadCollections();
    loadGenerations();
    setupCollectionModal();
});

function setupCollectionModal() {
    const modal = document.getElementById('newCollectionModal');
    const form = document.getElementById('newCollectionForm');
    const cancelBtn = document.getElementById('cancelCollectionBtn');

    // Close modal when clicking cancel
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('collectionTitle').value;
        
        try {
            const response = await fetch('/api/collections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title })
            });

            if (!response.ok) throw new Error('Failed to create collection');
            
            const collection = await response.json();
            modal.classList.remove('active');
            form.reset();
            loadCollections(); // Refresh collections
        } catch (error) {
            console.error('Error creating collection:', error);
        }
    });
}

async function loadCollections() {
    try {
        const response = await fetch('/api/collections');
        if (!response.ok) throw new Error('Failed to load collections');
        
        const collections = await response.json();
        displayCollections(collections);
    } catch (error) {
        console.error('Error loading collections:', error);
    }
}

function displayCollections(collections) {
    const grid = document.getElementById('collectionsGrid');
    grid.innerHTML = '';

    // Add "Create New Collection" card
    const newCollectionCard = createNewCollectionCard();
    grid.appendChild(newCollectionCard);

    // Add existing collections
    collections.forEach(collection => {
        const card = createCollectionCard(collection);
        grid.appendChild(card);
    });
}

function createNewCollectionCard() {
    const card = document.createElement('div');
    card.className = 'collection-card new-collection';
    
    const icon = document.createElement('div');
    icon.className = 'collection-icon';
    icon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `;

    const title = document.createElement('div');
    title.className = 'collection-title';
    title.textContent = 'Create New Collection';

    card.appendChild(icon);
    card.appendChild(title);

    card.addEventListener('click', () => {
        document.getElementById('newCollectionModal').classList.add('active');
    });

    return card;
}

function createCollectionCard(collection) {
    const card = document.createElement('div');
    card.className = 'collection-card';
    
    const preview = document.createElement('div');
    preview.className = 'collection-preview';

    // Create grid container for placeholders
    const gridContainer = document.createElement('div');
    gridContainer.className = 'placeholder-grid';

    // Create main placeholder (left side)
    const mainPlaceholder = document.createElement('div');
    mainPlaceholder.className = 'image-placeholder main-placeholder';
    gridContainer.appendChild(mainPlaceholder);

    // Create right side container
    const rightContainer = document.createElement('div');
    rightContainer.className = 'right-placeholders';

    // Add two smaller placeholders on the right
    for (let i = 0; i < 2; i++) {
        const smallPlaceholder = document.createElement('div');
        smallPlaceholder.className = 'image-placeholder small-placeholder';
        if (i === 0) {
            const dropdown = this.createImageOptionsDropdown();
            smallPlaceholder.appendChild(dropdown);
        }
        rightContainer.appendChild(smallPlaceholder);
    }

    gridContainer.appendChild(rightContainer);
    preview.appendChild(gridContainer);

    const info = document.createElement('div');
    info.className = 'collection-info';
    
    const title = document.createElement('h3');
    title.className = 'collection-title';
    title.textContent = collection.title;

    const count = document.createElement('div');
    count.className = 'collection-count';
    count.textContent = `${collection.images?.length || 0} images`;

    info.appendChild(title);
    info.appendChild(count);

    card.appendChild(preview);
    card.appendChild(info);

    return card;
}

async function loadGenerations() {
    try {
        const response = await fetch('/api/generations');
        if (!response.ok) throw new Error('Failed to load generations');
        
        const generations = await response.json();
        const collections = await fetch('/api/collections').then(res => res.json());
        displayGenerations(generations, collections);
    } catch (error) {
        console.error('Error loading generations:', error);
    }
}

function displayGenerations(generations, collections) {
    const grid = document.getElementById('generationsGrid');
    grid.innerHTML = '';

    const collectionImageUrls = new Set();
    collections.forEach(collection => {
        if (collection.images) {
            collection.images.forEach(image => collectionImageUrls.add(image.imageData));
        }
    });

    const displayedImageUrls = new Set();
    generations.forEach(generation => {
        if (!collectionImageUrls.has(generation.imageData) && !displayedImageUrls.has(generation.imageData)) {
            const card = document.createElement('div');
            card.className = 'generation-card';
            
            const img = document.createElement('img');
            img.src = generation.imageUrl;
            img.alt = generation.prompt || 'Generated sticker';

            const dropdown = this.createImageOptionsDropdown(generation);
            
            card.appendChild(img);
            card.appendChild(dropdown);
            grid.appendChild(card);
            displayedImageUrls.add(generation.imageData);
        }
    });
}

// Handle new collection creation
document.querySelector('.new-collection')?.addEventListener('click', () => {
    // TODO: Implement collection creation modal
    console.log('Create new collection clicked');
});

    function createImageOptionsDropdown(generation) {
        const dropdown = document.createElement('select');
        dropdown.className = 'image-options-dropdown';
        dropdown.innerHTML = `
            <option value="prompt">Prompt</option>
            <option value="add-to-collection">Add to Collection</option>
            <option value="download">Download</option>
            <option value="upscale">Upscale</option>
            <option value="move-to-trash">Move to Trash</option>
        `;
        dropdown.addEventListener('change', (e) => {
            const selectedOption = e.target.value;
            switch (selectedOption) {
                case 'prompt':
                    this.handlePrompt(generation);
                    break;
                case 'add-to-collection':
                    this.handleAddToCollection(generation);
                    break;
                case 'download':
                    this.handleDownload(generation);
                    break;
                case 'upscale':
                    this.handleUpscale(generation);
                    break;
                case 'move-to-trash':
                    this.handleMoveToTrash(generation);
                    break;
            }
        });
        return dropdown;
    };

    // Placeholder functions for dropdown options
    function handlePrompt(generation) {
        console.log('Prompt selected', generation);
        // Add your prompt handling logic here
    };

    function handleAddToCollection(generation) {
        console.log('Add to Collection selected', generation);
        // Add your Add to Collection handling logic here (likely involves opening the modal)
        document.getElementById('newCollectionModal').classList.add('active');
        loadCollections();
        loadGenerations();
    };

    function handleDownload(generation) {
        console.log('Download selected', generation);
        // Add your download handling logic here
    };

    function handleUpscale(generation) {
        console.log('Upscale selected', generation);
        // Add your upscale handling logic here
    };

    function handleMoveToTrash(generation) {
        console.log('Move to Trash selected', generation);
        // Add your Move to Trash handling logic here
    };
