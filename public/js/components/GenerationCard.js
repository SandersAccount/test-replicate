import { CollectionSelector } from './CollectionSelector.js';

let collectionSelector;

export function createGenerationCard(generation) {
    const card = document.createElement('div');
    card.className = 'generation-card';
    // Add data attribute for easy card removal
    card.dataset.generationId = generation._id;
    
    // Create image wrapper
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'image-wrapper';
    
    const img = document.createElement('img');
    img.src = generation.imageData || generation.output[0];
    img.alt = generation.prompt || 'Generated sticker';
    imageWrapper.appendChild(img);

    // Create menu button
    const menuButton = document.createElement('button');
    menuButton.className = 'menu-button';
    menuButton.innerHTML = '<i class="fas fa-ellipsis-h"></i>';
    
    // Create menu dropdown
    const menuDropdown = document.createElement('div');
    menuDropdown.className = 'menu-dropdown';
    
    const menuItems = [
        {
            label: 'Prompt',
            icon: 'fas fa-comment',
            action: () => alert(generation.prompt || 'No prompt available')
        },
        { type: 'separator' },
        {
            label: 'Move to Collection',
            icon: 'fas fa-folder-plus',
            action: () => showCollectionSelector(generation._id)
        },
        {
            label: 'Download',
            icon: 'fas fa-download',
            action: () => downloadImage(generation.imageData || generation.output[0], generation.prompt)
        },
        {
            label: 'Upscale',
            icon: 'fas fa-expand-arrows-alt',
            disabled: true,
            action: () => alert('Upscale feature coming soon!')
        },
        { type: 'separator' },
        {
            label: 'Move to Trash',
            icon: 'fas fa-trash',
            class: 'text-danger',
            action: () => deleteGeneration(generation._id, card)
        }
    ];

    menuItems.forEach(item => {
        if (item.type === 'separator') {
            const separator = document.createElement('div');
            separator.className = 'menu-separator';
            menuDropdown.appendChild(separator);
        } else {
            const menuItem = document.createElement('button');
            menuItem.className = `menu-item ${item.disabled ? 'disabled' : ''} ${item.class || ''}`;
            menuItem.innerHTML = `
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
            `;
            if (!item.disabled) {
                menuItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    hideAllMenus();
                    item.action();
                });
            }
            menuDropdown.appendChild(menuItem);
        }
    });

    // Add hover effect container
    const hoverEffect = document.createElement('div');
    hoverEffect.className = 'hover-effect';

    imageWrapper.appendChild(hoverEffect);
    imageWrapper.appendChild(menuButton);
    imageWrapper.appendChild(menuDropdown);
    card.appendChild(imageWrapper);
    
    // Handle menu button click
    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        hideAllMenus();
        menuDropdown.classList.toggle('active');
        menuButton.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', () => {
        hideAllMenus();
    });

    return card;
}

function hideAllMenus() {
    document.querySelectorAll('.menu-dropdown.active').forEach(menu => {
        menu.classList.remove('active');
    });
    document.querySelectorAll('.menu-button.active').forEach(button => {
        button.classList.remove('active');
    });
}

async function deleteGeneration(generationId, cardElement) {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
        const response = await fetch(`/api/generations/${generationId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to delete generation');
        
        // Add fade-out animation
        cardElement.style.transition = 'opacity 0.3s ease';
        cardElement.style.opacity = '0';
        
        // Remove the card after animation
        setTimeout(() => {
            cardElement.remove();
            
            // Dispatch event for image deletion
            window.dispatchEvent(new CustomEvent('imageDeleted', {
                detail: { generationId }
            }));
        }, 300);
        
    } catch (error) {
        console.error('Error deleting generation:', error);
        alert('Failed to delete image');
    }
}

async function downloadImage(url, prompt) {
    try {
        // Fetch the image
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Create object URL
        const blobUrl = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `sticker-${prompt ? prompt.slice(0, 30).replace(/[^a-z0-9]/gi, '-') : 'untitled'}.png`;
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
        console.error('Error downloading image:', error);
        alert('Failed to download image');
    }
}

function showCollectionSelector(generationId) {
    if (!collectionSelector) {
        collectionSelector = new CollectionSelector();
    }
    collectionSelector.show(generationId);
}

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
