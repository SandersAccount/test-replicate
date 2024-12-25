export function setupCollectionModal() {
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
            
            // Dispatch event for collection creation
            window.dispatchEvent(new CustomEvent('collectionCreated', { 
                detail: { collection } 
            }));
        } catch (error) {
            console.error('Error creating collection:', error);
        }
    });
}

export function showCollectionModal() {
    document.getElementById('newCollectionModal').classList.add('active');
}
