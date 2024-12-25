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
            smallPlaceholder.innerHTML = '<div class="options-icon">⋮</div>';
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
        displayGenerations(generations);
    } catch (error) {
        console.error('Error loading generations:', error);
    }
}

function displayGenerations(generations) {
    const grid = document.getElementById('generationsGrid');
    grid.innerHTML = '';

    generations.forEach(generation => {
        const card = document.createElement('div');
        card.className = 'generation-card';
        
        const img = document.createElement('img');
        img.src = generation.imageData;
        img.alt = generation.prompt || 'Generated sticker';
        
        card.appendChild(img);
        grid.appendChild(card);
    });
}

// Handle new collection creation
document.querySelector('.new-collection')?.addEventListener('click', () => {
    // TODO: Implement collection creation modal
    console.log('Create new collection clicked');
});
