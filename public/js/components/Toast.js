export class Toast extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 10000;
                }

                .toast {
                    background: #1E1E1E;
                    color: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    min-width: 200px;
                    max-width: 400px;
                    transform: translateY(-100px);
                    opacity: 0;
                    transition: transform 0.3s, opacity 0.3s;
                }

                .toast.show {
                    transform: translateY(0);
                    opacity: 1;
                }

                .title {
                    font-weight: 500;
                    font-size: 1rem;
                    margin-bottom: 4px;
                }

                .message {
                    font-size: 0.9rem;
                    color: #CCC;
                    line-height: 1.4;
                }

                .dismiss {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    padding: 4px;
                    font-size: 0.8rem;
                    transition: color 0.2s;
                }

                .dismiss:hover {
                    color: white;
                }
            </style>
            <div class="toast">
                <div class="title"></div>
                <div class="message"></div>
                <button class="dismiss">Dismiss</button>
            </div>
        `;

        this.toast = this.shadowRoot.querySelector('.toast');
        this.titleEl = this.shadowRoot.querySelector('.title');
        this.messageEl = this.shadowRoot.querySelector('.message');
        this.dismissBtn = this.shadowRoot.querySelector('.dismiss');

        this.dismissBtn.addEventListener('click', () => this.hide());
    }

    show(message, type = 'info', duration = 3000, title = '') {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        this.titleEl.textContent = title;
        this.messageEl.textContent = message;
        this.titleEl.style.display = title ? 'block' : 'none';
        
        this.toast.classList.add('show');

        if (duration > 0) {
            this.hideTimeout = setTimeout(() => this.hide(), duration);
        }
    }

    hide() {
        this.toast.classList.remove('show');
    }
}

customElements.define('toast-notification', Toast);
