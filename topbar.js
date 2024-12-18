// Get user info from server
async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        const user = await response.json();
        return user;
    } catch (error) {
        console.error('Error loading user info:', error);
        return null;
    }
}

// Create topbar HTML
async function createTopbar() {
    const user = await loadUserInfo();
    if (!user) return;

    const topbar = document.getElementById('topbar');
    if (!topbar) return;

    topbar.innerHTML = `
        <div class="logo">AI Image Generator</div>
        <div class="user-profile" onclick="toggleDropdown()">
            <div class="profile-circle">${user.name ? user.name[0] : 'U'}</div>
            <div class="dropdown-menu">
                <a href="/profile">Profile</a>
                ${user.role === 'admin' ? '<a href="/admin">Admin Dashboard</a>' : ''}
                <a href="/subscription">Subscription</a>
                <a href="#" onclick="logout()">Logout</a>
            </div>
        </div>
    `;
}

// Toggle dropdown menu
function toggleDropdown() {
    const dropdown = document.querySelector('.dropdown-menu');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('.user-profile')) {
        const dropdown = document.querySelector('.dropdown-menu');
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
});

// Logout function
async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/login';
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// Initialize topbar when DOM is loaded
document.addEventListener('DOMContentLoaded', createTopbar);
