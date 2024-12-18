// Function to get user initials from name
function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .slice(0, 2);
}

// Create and insert topbar
async function createTopbar() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (window.location.pathname !== '/auth') {
                window.location.href = '/auth';
            }
            return;
        }

        const { user } = await response.json();
        if (!user || !user.name) {
            throw new Error('Invalid user data');
        }

        const initials = getInitials(user.name);
        const topbar = document.getElementById('topbar');
        
        if (!topbar) {
            console.error('Topbar element not found');
            return;
        }

        topbar.innerHTML = `
            <div class="logo">WindSurf AI</div>
            <div class="user-profile">
                <div class="profile-circle">${initials}</div>
                <div class="dropdown-menu">
                    <a href="/profile">My Profile</a>
                    <a href="#" id="logoutButton">Logout</a>
                </div>
            </div>
        `;

        // Add event listeners
        const profileCircle = topbar.querySelector('.profile-circle');
        const dropdownMenu = topbar.querySelector('.dropdown-menu');
        
        if (profileCircle && dropdownMenu) {
            profileCircle.addEventListener('click', () => {
                dropdownMenu.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (event) => {
                if (!event.target.closest('.user-profile')) {
                    dropdownMenu.classList.remove('show');
                }
            });
        }

        // Handle logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', async (e) => {
                e.preventDefault();
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
    } catch (error) {
        console.error('Error creating topbar:', error);
        if (window.location.pathname !== '/auth') {
            window.location.href = '/auth';
        }
    }
}

// Initialize topbar only if we're not on the auth page
if (window.location.pathname !== '/auth') {
    createTopbar();
}
