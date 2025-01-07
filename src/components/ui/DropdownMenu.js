export class DropdownMenu extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .menu-button {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0, 0, 0, 0.5);
                    border: none;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    cursor: pointer;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                }

                .menu-button:hover {
                    background: rgba(0, 0, 0, 0.7);
                }

                .menu {
                    position: absolute;
                    top: 45px;
                    right: 10px;
                    background: #2a2a2a;
                    border-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    display: none;
                    z-index: 3;
                }

                .menu.show {
                    display: block;
                }

                .menu-item {
                    padding: 8px 16px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    white-space: nowrap;
                }

                .menu-item:hover {
                    background: #3a3a3a;
                }

                .menu-item i {
                    width: 16px;
                }
            </style>
            <button class="menu-button">
                <i class="fas fa-ellipsis-v"></i>
            </button>
            <div class="menu">
                <slot></slot>
            </div>
        `;
    }

    setupEventListeners() {
        const button = this.shadowRoot.querySelector('.menu-button');
        const menu = this.shadowRoot.querySelector('.menu');

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        this.isOpen = !this.isOpen;
        const menu = this.shadowRoot.querySelector('.menu');
        menu.classList.toggle('show', this.isOpen);
    }

    closeMenu() {
        this.isOpen = false;
        const menu = this.shadowRoot.querySelector('.menu');
        menu.classList.remove('show');
    }
}

customElements.define('dropdown-menu', DropdownMenu);
