export async function createTopbar(container = document.body) {
    // Fetch user data first
    const response = await fetch('/api/auth/user', {
        credentials: 'include'
    });
    const user = await response.json();

    const topbar = document.createElement('div');
    topbar.className = 'topbar';
    topbar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #1a1a1a;
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 1000;
        border-bottom: 1px solid #333;
    `;

    const leftSection = document.createElement('div');
    leftSection.style.cssText = `
        display: flex;
        align-items: center;
        gap: 2rem;
    `;

    const logo = document.createElement('a');
    logo.href = '/';
    logo.className = 'logo';
    logo.textContent = 'Sticker Generator';
    logo.style.cssText = `
        color: #fff;
        text-decoration: none;
        font-weight: 600;
        font-size: 1.2rem;
    `;

    const nav = document.createElement('nav');
    nav.className = 'nav-links';
    nav.style.cssText = `
        display: flex;
        gap: 1.5rem;
    `;

    const links = [
        { text: 'Generator', href: '/' },
        { text: 'Collections', href: '/collections' }
    ];

    links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.text;
        a.style.cssText = `
            color: #fff;
            text-decoration: none;
            opacity: 0.8;
            transition: opacity 0.2s;
        `;
        if (window.location.pathname === link.href) {
            a.style.opacity = '1';
        }
        a.onmouseenter = () => a.style.opacity = '1';
        a.onmouseleave = () => {
            if (window.location.pathname !== link.href) {
                a.style.opacity = '0.8';
            }
        };
        nav.appendChild(a);
    });

    leftSection.appendChild(logo);
    leftSection.appendChild(nav);

    // Create profile section
    const profileSection = document.createElement('div');
    profileSection.className = 'profile-section';
    profileSection.style.cssText = `
        position: relative;
        display: flex;
        align-items: center;
        gap: 1rem;
    `;

    const profileButton = document.createElement('button');
    profileButton.className = 'profile-button';
    profileButton.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #4CAF50;
        border: none;
        color: white;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
    `;
    profileButton.textContent = getInitials(user.name);

    const dropdown = document.createElement('div');
    dropdown.className = 'profile-dropdown';
    dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 0.5rem;
        background: #2a2a2a;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        min-width: 200px;
        display: none;
        z-index: 1000;
    `;

    const dropdownContent = `
        <div style="padding: 1rem; border-bottom: 1px solid #444;">
            <div style="font-weight: 600; color: #fff;">${user.name}</div>
            <div style="color: #888; font-size: 0.9rem;">${user.email}</div>
        </div>
        <div style="padding: 0.5rem;">
            <a href="/profile" class="dropdown-item">Personal Info</a>
            <a href="/profile?tab=subscription" class="dropdown-item">Subscription</a>
            <a href="/profile?tab=credits" class="dropdown-item">Credits</a>
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item" id="signOutButton">Sign Out</a>
        </div>
    `;
    dropdown.innerHTML = dropdownContent;

    // Add styles for dropdown items
    const style = document.createElement('style');
    style.textContent = `
        .dropdown-item {
            display: block;
            padding: 0.5rem 1rem;
            color: #fff;
            text-decoration: none;
            transition: background-color 0.2s;
        }
        .dropdown-item:hover {
            background-color: #444;
        }
        .dropdown-divider {
            height: 1px;
            background-color: #444;
            margin: 0.5rem 0;
        }
    `;
    document.head.appendChild(style);

    // Toggle dropdown
    profileButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdown.style.display = 'none';
    });

    // Handle sign out
    dropdown.querySelector('#signOutButton').addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch('/api/auth/logout', { 
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/login';
    });

    profileSection.appendChild(profileButton);
    profileSection.appendChild(dropdown);

    topbar.appendChild(leftSection);
    topbar.appendChild(profileSection);

    // Add margin to body to account for fixed topbar
    document.body.style.marginTop = '64px';
    
    // If a container is provided, insert at beginning
    if (container === document.body) {
        container.insertBefore(topbar, container.firstChild);
    } else {
        container.appendChild(topbar);
    }

    return topbar;
}

function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase();
}
