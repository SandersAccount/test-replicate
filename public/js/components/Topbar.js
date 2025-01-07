export async function createTopbar() {
    const topbar = document.createElement('div');
    topbar.className = 'topbar';

    const content = document.createElement('div');
    content.className = 'topbar-content';

    // Left section with logo
    const leftSection = document.createElement('div');
    leftSection.className = 'topbar-left';
    
    const logo = document.createElement('a');
    logo.href = '/';
    logo.className = 'logo';
    logo.textContent = 'Sticker Generator';
    
    leftSection.appendChild(logo);

    // Center section with navigation
    const centerSection = document.createElement('div');
    centerSection.className = 'topbar-center';

    const navItems = [
        { text: 'Generator', href: '/' },
        { text: 'Collections', href: '/collections' }
    ];

    navItems.forEach(item => {
        const link = document.createElement('a');
        link.href = item.href;
        link.className = 'nav-link';
        if (window.location.pathname === item.href) {
            link.classList.add('active');
        }
        link.textContent = item.text;
        centerSection.appendChild(link);
    });

    // Right section with user info
    const rightSection = document.createElement('div');
    rightSection.className = 'topbar-right';

    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });

        const userData = await response.json();

        if (userData) {
            // Credits indicator
            const creditsIndicator = document.createElement('div');
            creditsIndicator.className = 'credits-indicator';

            const creditsIcon = document.createElement('i');
            creditsIcon.className = 'fas fa-coins';

            const creditsCount = document.createElement('span');
            creditsCount.textContent = userData.credits || '0';
            creditsCount.id = 'topbarCredits';

            creditsIndicator.appendChild(creditsIcon);
            creditsIndicator.appendChild(creditsCount);

            // Upgrade button
            const upgradeButton = document.createElement('button');
            upgradeButton.className = 'btn-upgrade';
            upgradeButton.textContent = 'Upgrade';
            upgradeButton.addEventListener('click', () => {
                window.location.href = '/profile?tab=subscription';
            });

            // User menu button
            const userButton = document.createElement('button');
            userButton.className = 'user-menu-button';

            const avatar = document.createElement('div');
            avatar.className = 'user-avatar';
            avatar.textContent = userData.name ? userData.name[0].toUpperCase() : 'U';

            userButton.appendChild(avatar);

            // Add elements to right section
            rightSection.appendChild(creditsIndicator);
            rightSection.appendChild(upgradeButton);
            rightSection.appendChild(userButton);

            // User dropdown (simplified for now)
            const dropdown = document.createElement('div');
            dropdown.className = 'user-dropdown';
            dropdown.style.display = 'none';
            dropdown.style.position = 'absolute';
            dropdown.style.top = '100%';
            dropdown.style.right = '0';
            dropdown.style.backgroundColor = '#ffffff';
            dropdown.style.borderRadius = '8px';
            dropdown.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            dropdown.style.width = '200px';
            dropdown.style.marginTop = '0.5rem';

            // Toggle dropdown
            userButton.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            });

            document.addEventListener('click', () => {
                dropdown.style.display = 'none';
            });

            rightSection.appendChild(dropdown);
        } else {
            const loginButton = document.createElement('a');
            loginButton.href = '/login';
            loginButton.textContent = 'Login';
            loginButton.style.color = '#ffffff';
            loginButton.style.textDecoration = 'none';
            rightSection.appendChild(loginButton);
        }

        // Listen for credit updates
        window.addEventListener('creditsUpdated', (event) => {
            if (event.detail && typeof event.detail.credits === 'number') {
                const creditsElement = document.getElementById('topbarCredits');
                if (creditsElement) {
                    creditsElement.textContent = event.detail.credits;
                }
            }
        });

    } catch (error) {
        console.error('Error loading user data:', error);
    }

    // Assemble the topbar
    content.appendChild(leftSection);
    content.appendChild(centerSection);
    content.appendChild(rightSection);
    topbar.appendChild(content);

    // Insert into DOM
    const topbarElement = document.getElementById('topbar');
    if (topbarElement) {
        topbarElement.replaceChildren(topbar);
    }

    return topbar;
}
