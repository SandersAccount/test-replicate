// Create and inject the topbar
function createTopbar() {
    const topbar = document.createElement('div');
    topbar.className = 'topbar';
    topbar.innerHTML = `
        <a href="/" class="logo">AI Image Generator</a>
        <div class="profile-section">
            <div class="profile-circle" id="profileButton">
                <span>👤</span>
            </div>
            <div class="profile-menu" id="profileMenu">
                <a href="/profile">Profile</a>
                <a href="/plans">Subscription</a>
                <a href="#" id="logoutButton">Logout</a>
            </div>
        </div>
    `;

    // Insert the topbar at the beginning of the body
    document.body.insertBefore(topbar, document.body.firstChild);

    // Add event listeners
    const profileButton = document.getElementById('profileButton');
    const profileMenu = document.getElementById('profileMenu');
    const logoutButton = document.getElementById('logoutButton');

    profileButton.addEventListener('click', () => {
        profileMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!profileButton.contains(event.target) && !profileMenu.contains(event.target)) {
            profileMenu.classList.remove('active');
        }
    });

    logoutButton.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                window.location.href = '/auth';
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    });
}

// Call createTopbar when the DOM is loaded
document.addEventListener('DOMContentLoaded', createTopbar);
