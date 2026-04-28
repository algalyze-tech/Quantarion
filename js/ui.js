/**
 * UI Module
 * Handles rendering, modal interactions, and user interface updates
 */

class UIManager {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    async init() {
        // Register service worker for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker registration failed:', err));
        }

        // Add event listeners
        this.setupEventListeners();

        // Render initial UI
        this.updateUIState();

        this.isInitialized = true;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Voice input
        const micBtn = document.getElementById('micBtn');
        if (micBtn) {
            micBtn.addEventListener('click', () => this.toggleVoiceInput());
        }

        // File upload
        const fileBtn = document.getElementById('fileBtn');
        if (fileBtn) {
            fileBtn.addEventListener('click', () => this.openFileDialog());
        }

        // Copy response
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn')) {
                this.copyToClipboard(e.target);
            }
        });

        // Auth modal events
        document.addEventListener('openAuthModal', () => this.showAuthModal());
        document.addEventListener('openUserProfile', (e) => this.showUserProfile(e.detail.user));

        // Settings changes
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                settingsManager.updateSetting('theme', e.target.value);
            });
        }

        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                settingsManager.updateSetting('language', e.target.value);
            });
        }
    }

    /**
     * Toggle voice input
     */
    toggleVoiceInput() {
        if (voiceManager.isListening) {
            voiceManager.stopListening();
        } else {
            voiceManager.startListening();
        }
    }

    /**
     * Open file dialog
     */
    openFileDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf,.txt,.json';
        input.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleFileUpload(e.target.files[0]);
            }
        });
        input.click();
    }

    /**
     * Handle file upload
     */
    async handleFileUpload(file) {
        const result = await fileManager.handleFileSelect(file);
        
        if (result.success) {
            // Show file in UI
            const input = document.getElementById('aiInput');
            if (input) {
                input.value += `\n[File uploaded: ${result.fileData.name}]`;
            }
            this.showNotification(`File uploaded: ${result.fileData.name}`);
        } else {
            this.showNotification(`Upload failed: ${result.error}`, 'error');
        }
    }

    /**
     * Copy to clipboard
     */
    async copyToClipboard(element) {
        const text = element.previousElementSibling?.textContent || element.textContent;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copied to clipboard');
            
            // Change button text temporarily
            const original = element.textContent;
            element.textContent = '✓ Copied';
            setTimeout(() => {
                element.textContent = original;
            }, 2000);
        } catch (error) {
            this.showNotification('Copy failed', 'error');
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#22c55e'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInUp 0.3s ease-out;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'slideOutDown 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Show auth modal
     */
    showAuthModal() {
        const modal = document.createElement('div');
        modal.className = 'auth-modal-overlay';
        modal.id = 'authModalOverlay';
        modal.innerHTML = `
            <div class="auth-modal" style="
                background: rgba(20, 30, 50, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 25px 20px;
                width: 100%;
                max-width: 340px;
                backdrop-filter: blur(20px);
            ">
                <h2 style="
                    font-size: 16px;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 20px;
                    text-align: center;
                ">🔐 Sign In</h2>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button onclick="this.handleGoogleLogin()" style="
                        width: 100%;
                        padding: 12px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: white;
                        border-radius: 10px;
                        cursor: pointer;
                        font-weight: 600;
                    ">👍 Google Login</button>

                    <div style="position: relative;">
                        <input type="email" id="authEmail" placeholder="Email" style="
                            width: 100%;
                            padding: 12px;
                            border-radius: 10px;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            background: rgba(0, 0, 0, 0.3);
                            color: white;
                            outline: none;
                        ">
                    </div>

                    <input type="password" id="authPassword" placeholder="Password" style="
                        width: 100%;
                        padding: 12px;
                        border-radius: 10px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        background: rgba(0, 0, 0, 0.3);
                        color: white;
                        outline: none;
                    ">

                    <button onclick="this.handleEmailLogin()" style="
                        width: 100%;
                        padding: 12px;
                        background: #22c55e;
                        color: black;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Sign In</button>

                    <button onclick="this.handlePhoneLogin()" style="
                        width: 100%;
                        padding: 12px;
                        background: rgba(59, 130, 246, 0.2);
                        border: 1px solid rgba(59, 130, 246, 0.3);
                        color: #60a5fa;
                        border-radius: 10px;
                        cursor: pointer;
                        font-weight: 600;
                    ">📱 Phone Login</button>
                </div>

                <button onclick="document.getElementById('authModalOverlay').remove()" style="
                    width: 100%;
                    margin-top: 16px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #a0a5b0;
                    border-radius: 10px;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;

        modal.style.cssText = `
            display: flex;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.95);
            z-index: 1002;
            align-items: center;
            justify-content: center;
        `;

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        document.body.appendChild(modal);
    }

    /**
     * Show user profile
     */
    showUserProfile(user) {
        const modal = document.createElement('div');
        modal.id = 'userProfileModal';
        modal.innerHTML = `
            <div style="
                background: rgba(20, 30, 50, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 25px 20px;
                width: 100%;
                max-width: 340px;
                backdrop-filter: blur(20px);
            ">
                <h2 style="
                    font-size: 16px;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 20px;
                    text-align: center;
                ">👤 User Profile</h2>

                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${user.photoURL}" alt="Avatar" style="
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        margin-bottom: 12px;
                    ">
                    <h3 style="color: white; margin: 0;">${user.displayName}</h3>
                    <p style="color: #a0a5b0; font-size: 13px; margin: 4px 0;">${user.email}</p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button onclick="this.handleLogout()" style="
                        width: 100%;
                        padding: 12px;
                        background: #ef4444;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        font-weight: 600;
                    ">🚪 Logout</button>

                    <button onclick="document.getElementById('userProfileModal').remove()" style="
                        width: 100%;
                        padding: 12px;
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        color: #a0a5b0;
                        border-radius: 10px;
                        cursor: pointer;
                    ">Close</button>
                </div>
            </div>
        `;

        modal.style.cssText = `
            display: flex;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.95);
            z-index: 1002;
            align-items: center;
            justify-content: center;
        `;

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        document.body.appendChild(modal);
    }

    /**
     * Handle login actions (delegate to auth)
     */
    async handleGoogleLogin() {
        const result = await authManager.loginWithGoogle();
        if (result.success) {
            this.showNotification('Logged in successfully');
            document.getElementById('authModalOverlay')?.remove();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    async handleEmailLogin() {
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        
        if (!email || !password) {
            this.showNotification('Please fill all fields', 'error');
            return;
        }

        const result = await authManager.loginWithEmail(email, password);
        if (result.success) {
            this.showNotification('Logged in successfully');
            document.getElementById('authModalOverlay')?.remove();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    async handlePhoneLogin() {
        const phone = prompt('Enter your phone number:');
        if (phone) {
            const result = await authManager.sendOTP(phone);
            if (result.success) {
                const otp = prompt('Enter OTP:');
                if (otp) {
                    const loginResult = await authManager.loginWithOTP(phone, otp);
                    if (loginResult.success) {
                        this.showNotification('Logged in successfully');
                        document.getElementById('authModalOverlay')?.remove();
                    } else {
                        this.showNotification(loginResult.error, 'error');
                    }
                }
            } else {
                this.showNotification(result.error, 'error');
            }
        }
    }

    handleLogout() {
        const confirmed = confirm('Are you sure you want to logout?');
        if (confirmed) {
            authManager.logout();
            document.getElementById('userProfileModal')?.remove();
            this.updateUIState();
            this.showNotification('Logged out');
        }
    }

    /**
     * Update UI based on current state
     */
    updateUIState() {
        authManager.updateUI();
        
        // Update theme
        const theme = settingsManager.settings.theme;
        settingsManager.applyTheme(theme);
    }

    /**
     * Add buttons to chat messages
     */
    addResponseActions(messageElement, content) {
        const actionsDiv = document.createElement('div');
        actionsDiv.style.cssText = 'display: flex; gap: 8px; margin-top: 8px; font-size: 12px;';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '📋 Copy';
        copyBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #60a5fa;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
        `;

        const shareBtn = document.createElement('button');
        shareBtn.textContent = '📤 Share';
        shareBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #60a5fa;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
        `;
        shareBtn.onclick = () => this.shareMessage(content);

        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(shareBtn);
        messageElement.appendChild(actionsDiv);
    }

    /**
     * Share message
     */
    async shareMessage(content) {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Quantarion',
                    text: content
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share error:', err);
                }
            }
        } else {
            // Fallback to copy
            await navigator.clipboard.writeText(content);
            this.showNotification('Link copied to clipboard');
        }
    }

    /**
     * Show typing animation
     */
    showTypingAnimation(container) {
        const typing = document.createElement('div');
        typing.className = 'typing-animation';
        typing.innerHTML = `
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: bounce 1.4s infinite;"></span>
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: bounce 1.4s infinite 0.2s;"></span>
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: bounce 1.4s infinite 0.4s;"></span>
        `;
        container.appendChild(typing);
        return typing;
    }
}

// Initialize UI manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const uiManager = new UIManager();
    });
} else {
    const uiManager = new UIManager();
}
