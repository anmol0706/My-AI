// AI Web Application - Main JavaScript File

class AIWebApp {
    constructor() {
        this.currentTab = 'chat';
        this.chatHistory = [];
        this.imageHistory = [];
        this.isLoading = false;
        this.chatSessions = [];
        this.currentSessionId = null;
        this.sidebarCollapsed = false;

        // API endpoints
        this.API_BASE = '/api';
        this.CHAT_ENDPOINT = `${this.API_BASE}/chat/message`;
        this.IMAGE_ENDPOINT = `${this.API_BASE}/images/generate`;

        // Initialize the application
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadStoredData();
        this.updateUI();
        
        console.log('AI Web Application initialized');
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab[data-tab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Chat functionality
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-button');
        const clearChatButton = document.getElementById('clear-chat');
        
        chatInput.addEventListener('input', () => this.handleChatInput());
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        sendButton.addEventListener('click', () => this.sendMessage());
        clearChatButton.addEventListener('click', () => this.clearChat());
        
        // Image generation functionality
        const imagePrompt = document.getElementById('image-prompt');
        const negativePrompt = document.getElementById('negative-prompt');
        const generateButton = document.getElementById('generate-image');
        const advancedToggle = document.getElementById('advanced-toggle');
        const guidanceScale = document.getElementById('guidance-scale');
        const steps = document.getElementById('steps');
        const randomSeedBtn = document.getElementById('random-seed-btn');

        // Check if elements exist before adding listeners
        if (imagePrompt) {
            imagePrompt.addEventListener('input', () => this.handleImagePromptInput());
        }
        if (negativePrompt) {
            negativePrompt.addEventListener('input', () => this.handleNegativePromptInput());
        }
        if (generateButton) {
            generateButton.addEventListener('click', () => this.generateImage());
        }
        if (advancedToggle) {
            advancedToggle.addEventListener('click', () => this.toggleAdvancedSettings());
        }

        // Range sliders
        if (guidanceScale) {
            guidanceScale.addEventListener('input', (e) => {
                e.target.nextElementSibling.textContent = e.target.value;
            });
        }
        if (steps) {
            steps.addEventListener('input', (e) => {
                e.target.nextElementSibling.textContent = e.target.value;
            });
        }

        if (randomSeedBtn) {
            randomSeedBtn.addEventListener('click', () => this.generateRandomSeed());
        }
        
        // History functionality
        const exportButton = document.getElementById('export-data');
        const importButton = document.getElementById('import-data');
        const clearAllButton = document.getElementById('clear-all-data');
        const fileInput = document.getElementById('file-input');
        
        exportButton.addEventListener('click', () => this.exportData());
        importButton.addEventListener('click', () => fileInput.click());
        clearAllButton.addEventListener('click', () => this.clearAllData());
        fileInput.addEventListener('change', (e) => this.importData(e));

        // Chat sidebar functionality
        const newChatButton = document.getElementById('new-chat-btn');
        const sidebarToggle = document.getElementById('sidebar-toggle');

        newChatButton.addEventListener('click', () => this.startNewChat());
        sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    }
    
    switchTab(tabName) {
        // Skip if tabName is undefined (for nav links)
        if (!tabName) return;

        // Update active tab
        document.querySelectorAll('.nav-tab[data-tab]').forEach(tab => {
            tab.classList.remove('active');
        });
        const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const targetContent = document.getElementById(`${tabName}-tab`);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        this.currentTab = tabName;

        // Update history when switching to history tab
        if (tabName === 'history') {
            this.updateHistoryDisplay();
        }

        // Update sidebar when switching to chat tab
        if (tabName === 'chat') {
            this.updateChatSidebar();
        }
    }

    startNewChat() {
        // Create new chat session
        const sessionId = 'session_' + Date.now();
        const newSession = {
            id: sessionId,
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        this.chatSessions.unshift(newSession);
        this.currentSessionId = sessionId;

        // Clear current chat display
        this.clearChatDisplay();

        // Update sidebar
        this.updateChatSidebar();
        this.saveToStorage();

        this.showToast('success', 'New chat started!');
    }

    switchToSession(sessionId) {
        const session = this.chatSessions.find(s => s.id === sessionId);
        if (!session) return;

        this.currentSessionId = sessionId;

        // Clear current display
        this.clearChatDisplay();

        // Load session messages
        session.messages.forEach(message => {
            this.addMessageToDisplay(message.role, message.content, message.timestamp);
        });

        // Update sidebar
        this.updateChatSidebar();
    }

    deleteSession(sessionId) {
        if (confirm('Are you sure you want to delete this chat session?')) {
            this.chatSessions = this.chatSessions.filter(s => s.id !== sessionId);

            // If deleting current session, start new one
            if (this.currentSessionId === sessionId) {
                this.startNewChat();
            } else {
                this.updateChatSidebar();
            }

            this.saveToStorage();
            this.showToast('success', 'Chat session deleted');
        }
    }

    updateChatSidebar() {
        const container = document.getElementById('chat-sessions');

        if (this.chatSessions.length === 0) {
            container.innerHTML = '<p class="text-center text-secondary" style="padding: 1rem; font-size: 0.9rem;">No chat sessions yet</p>';
            return;
        }

        container.innerHTML = this.chatSessions.map(session => {
            const isActive = session.id === this.currentSessionId;
            const lastMessage = session.messages[session.messages.length - 1];
            const preview = lastMessage ? lastMessage.content.substring(0, 50) + '...' : 'No messages yet';
            const time = new Date(session.lastUpdated).toLocaleDateString();

            return `
                <div class="chat-session ${isActive ? 'active' : ''}" onclick="app.switchToSession('${session.id}')">
                    <div class="chat-session-title">${session.title}</div>
                    <div class="chat-session-preview">${preview}</div>
                    <div class="chat-session-time">${time}</div>
                    <div class="chat-session-actions">
                        <button class="session-action delete" onclick="event.stopPropagation(); app.deleteSession('${session.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleSidebar() {
        const sidebar = document.getElementById('chat-sidebar');
        this.sidebarCollapsed = !this.sidebarCollapsed;

        if (this.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
    }

    clearChatDisplay() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <h2>Welcome to AI Chat!</h2>
                <p>Start a conversation by typing a message below.</p>
            </div>
        `;
    }
    
    handleChatInput() {
        const input = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-button');
        const charCounter = document.querySelector('.chat-input-container .char-counter');
        
        const length = input.value.length;
        charCounter.textContent = `${length}/2000`;
        
        // Enable/disable send button
        sendButton.disabled = length === 0 || length > 2000 || this.isLoading;
        
        // Auto-resize textarea
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }
    
    handleImagePromptInput() {
        const input = document.getElementById('image-prompt');
        const charCounter = document.querySelector('.image-generation-form .char-counter');
        const generateButton = document.getElementById('generate-image');

        if (!input || !charCounter || !generateButton) {
            console.error('Image generation elements not found');
            return;
        }

        const length = input.value.length;
        charCounter.textContent = `${length}/1000`;

        // Enable/disable generate button
        generateButton.disabled = length === 0 || length > 1000 || this.isLoading;
    }
    
    handleNegativePromptInput() {
        const input = document.getElementById('negative-prompt');
        const charCounter = input.parentElement.querySelector('.char-counter');

        const length = input.value.length;
        charCounter.textContent = `${length}/500`;
    }

    toggleAdvancedSettings() {
        const advancedSettings = document.querySelector('.advanced-settings');
        advancedSettings.classList.toggle('open');
    }

    generateRandomSeed() {
        const seedInput = document.getElementById('seed');
        const randomSeed = Math.floor(Math.random() * 1000000);
        seedInput.value = randomSeed;
    }
    
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message || this.isLoading) return;

        // Ensure we have a current session
        if (!this.currentSessionId) {
            this.startNewChat();
        }

        // Clear input and disable button
        input.value = '';
        this.handleChatInput();

        // Add user message to chat
        this.addMessageToChat('user', message);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            this.isLoading = true;
            this.updateUI();

            // Get current session messages for context
            const currentSession = this.chatSessions.find(s => s.id === this.currentSessionId);
            const conversationHistory = currentSession ? currentSession.messages.slice(-10) : [];

            const response = await fetch(this.CHAT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    conversation_history: conversationHistory
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Remove typing indicator and add AI response
            this.hideTypingIndicator();
            this.addMessageToChat('assistant', data.response);

            this.showToast('success', 'Response generated successfully!');

        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.showToast('error', 'Failed to generate response. Please try again.');
        } finally {
            this.isLoading = false;
            this.updateUI();
        }
    }
    
    addMessageToChat(role, content) {
        const messagesContainer = document.getElementById('chat-messages');
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');

        // Remove welcome message if it exists
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date().toLocaleTimeString();

        messageContent.appendChild(messageTime);
        messageElement.appendChild(avatar);
        messageElement.appendChild(messageContent);

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Store in current session
        const messageData = {
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        };

        // Add to current session
        if (this.currentSessionId) {
            const currentSession = this.chatSessions.find(s => s.id === this.currentSessionId);
            if (currentSession) {
                currentSession.messages.push(messageData);
                currentSession.lastUpdated = new Date().toISOString();

                // Update session title with first user message
                if (role === 'user' && currentSession.title === 'New Chat') {
                    currentSession.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
                }
            }
        }

        // Also store in legacy chat history for backward compatibility
        this.chatHistory.push(messageData);

        // Update sidebar and save
        this.updateChatSidebar();
        this.saveToStorage();
    }
    
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        
        const typingElement = document.createElement('div');
        typingElement.className = 'typing-indicator';
        typingElement.id = 'typing-indicator';
        
        typingElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <span>AI is typing</span>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    clearChat() {
        if (confirm('Are you sure you want to clear the current chat?')) {
            // Clear current session messages
            if (this.currentSessionId) {
                const currentSession = this.chatSessions.find(s => s.id === this.currentSessionId);
                if (currentSession) {
                    currentSession.messages = [];
                    currentSession.title = 'New Chat';
                    currentSession.lastUpdated = new Date().toISOString();
                }
            }

            // Clear display
            this.clearChatDisplay();

            // Update sidebar and save
            this.updateChatSidebar();
            this.saveToStorage();
            this.showToast('success', 'Chat cleared');
        }
    }

    async generateImage() {
        console.log('Generate image method called');

        const promptInput = document.getElementById('image-prompt');
        const negativePromptInput = document.getElementById('negative-prompt');
        const modelSelect = document.getElementById('image-model');
        const sizeSelect = document.getElementById('image-size');
        const styleSelect = document.getElementById('image-style');
        const numImagesSelect = document.getElementById('num-images');
        const guidanceScaleInput = document.getElementById('guidance-scale');
        const stepsInput = document.getElementById('steps');
        const seedInput = document.getElementById('seed');

        // Check if all elements exist
        if (!promptInput || !negativePromptInput || !modelSelect || !sizeSelect || !styleSelect) {
            console.error('Required image generation elements not found');
            this.showToast('error', 'Image generation form not properly loaded');
            return;
        }

        const prompt = promptInput.value.trim();
        if (!prompt || this.isLoading) {
            console.log('No prompt or already loading');
            return;
        }

        const requestData = {
            prompt: prompt,
            negative_prompt: negativePromptInput.value.trim(),
            model: modelSelect.value,
            size: sizeSelect.value,
            style: styleSelect.value,
            num_images: parseInt(numImagesSelect.value),
            guidance_scale: parseFloat(guidanceScaleInput.value),
            steps: parseInt(stepsInput.value),
            seed: seedInput.value ? parseInt(seedInput.value) : null
        };

        try {
            this.setLoading(true, 'Generating image...');

            const response = await fetch(this.IMAGE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Display generated images
            this.displayGeneratedImages(data.images);

            // Store in image history
            data.images.forEach(image => {
                this.imageHistory.push({
                    id: image.image_id || Date.now().toString(),
                    prompt: image.prompt,
                    negative_prompt: image.negative_prompt,
                    image_url: image.image_url,
                    image_data: image.image_data,
                    size: requestData.size,
                    style: requestData.style,
                    timestamp: new Date().toISOString()
                });
            });

            this.saveToStorage();
            this.showToast('success', 'Image generated successfully!');

        } catch (error) {
            console.error('Error generating image:', error);
            this.showToast('error', 'Failed to generate image. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    displayGeneratedImages(images) {
        const container = document.getElementById('generated-images');

        images.forEach(image => {
            const imageElement = document.createElement('div');
            imageElement.className = 'image-result';

            const params = image.generation_params || {};
            const originalPrompt = params.original_prompt || image.prompt;
            const model = params.model || 'Unknown Model';
            const size = params.size || 'Unknown Size';
            const steps = params.steps || 'N/A';
            const guidance = params.guidance_scale || 'N/A';

            imageElement.innerHTML = `
                <img src="${image.image_url}" alt="Generated image" loading="lazy">
                <div class="image-info">
                    <div class="image-prompt">
                        <strong>Prompt:</strong> ${originalPrompt}
                    </div>
                    <div class="image-details">
                        <span class="detail-item"><strong>Model:</strong> ${model}</span>
                        <span class="detail-item"><strong>Size:</strong> ${size}</span>
                        <span class="detail-item"><strong>Steps:</strong> ${steps}</span>
                        <span class="detail-item"><strong>Guidance:</strong> ${guidance}</span>
                    </div>
                    <div class="image-actions">
                        <button class="image-action" onclick="app.downloadImage('${image.image_data}', '${originalPrompt}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button class="image-action" onclick="app.viewImageFullscreen('${image.image_url}')">
                            <i class="fas fa-expand"></i> View Full
                        </button>
                        <button class="image-action" onclick="app.copyPrompt('${originalPrompt}')">
                            <i class="fas fa-copy"></i> Copy Prompt
                        </button>
                        <button class="image-action" onclick="app.copySettings('${JSON.stringify(params).replace(/'/g, "\\'")}')">
                            <i class="fas fa-cog"></i> Copy Settings
                        </button>
                    </div>
                </div>
            `;

            container.insertBefore(imageElement, container.firstChild);
        });
    }

    downloadImage(imageData, prompt) {
        try {
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${imageData}`;
            link.download = `ai-generated-${prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showToast('success', 'Image downloaded successfully!');
        } catch (error) {
            console.error('Error downloading image:', error);
            this.showToast('error', 'Failed to download image');
        }
    }

    viewImageFullscreen(imageUrl) {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            cursor: pointer;
        `;

        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.cssText = `
            max-width: 90vw;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 8px;
        `;

        modal.appendChild(img);
        document.body.appendChild(modal);

        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    copyPrompt(prompt) {
        navigator.clipboard.writeText(prompt).then(() => {
            this.showToast('success', 'Prompt copied to clipboard!');
        }).catch(() => {
            this.showToast('error', 'Failed to copy prompt');
        });
    }

    copySettings(paramsJson) {
        try {
            const params = JSON.parse(paramsJson);

            // Apply settings to form
            if (params.model) document.getElementById('image-model').value = params.model;
            if (params.size) document.getElementById('image-size').value = params.size;
            if (params.style) document.getElementById('image-style').value = params.style;
            if (params.guidance_scale) {
                const guidanceInput = document.getElementById('guidance-scale');
                guidanceInput.value = params.guidance_scale;
                guidanceInput.nextElementSibling.textContent = params.guidance_scale;
            }
            if (params.steps) {
                const stepsInput = document.getElementById('steps');
                stepsInput.value = params.steps;
                stepsInput.nextElementSibling.textContent = params.steps;
            }
            if (params.seed) document.getElementById('seed').value = params.seed;

            this.showToast('success', 'Settings copied to form!');
        } catch (error) {
            this.showToast('error', 'Failed to copy settings');
        }
    }

    updateHistoryDisplay() {
        this.updateChatHistory();
        this.updateImageHistory();
    }

    updateChatHistory() {
        const container = document.getElementById('chat-history');

        if (this.chatHistory.length === 0) {
            container.innerHTML = '<p class="text-center text-secondary">No chat history available</p>';
            return;
        }

        // Group messages by conversation (simplified)
        const conversations = [];
        let currentConversation = [];

        this.chatHistory.forEach(message => {
            if (message.role === 'user' && currentConversation.length > 0) {
                conversations.push([...currentConversation]);
                currentConversation = [];
            }
            currentConversation.push(message);
        });

        if (currentConversation.length > 0) {
            conversations.push(currentConversation);
        }

        container.innerHTML = conversations.map((conversation, index) => {
            const firstMessage = conversation.find(m => m.role === 'user');
            const preview = firstMessage ? firstMessage.content.substring(0, 100) + '...' : 'Conversation';
            const timestamp = new Date(conversation[0].timestamp).toLocaleString();

            return `
                <div class="history-item">
                    <div class="history-item-header">
                        <strong>Conversation ${conversations.length - index}</strong>
                        <span class="history-item-time">${timestamp}</span>
                    </div>
                    <div class="history-item-content">${preview}</div>
                    <div class="history-item-actions">
                        <button class="history-action" onclick="app.restoreConversation(${index})">
                            <i class="fas fa-undo"></i> Restore
                        </button>
                        <button class="history-action danger" onclick="app.deleteConversation(${index})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateImageHistory() {
        const container = document.getElementById('image-history');

        if (this.imageHistory.length === 0) {
            container.innerHTML = '<p class="text-center text-secondary">No generated images available</p>';
            return;
        }

        container.innerHTML = this.imageHistory.slice().reverse().map((image, index) => {
            const timestamp = new Date(image.timestamp).toLocaleString();
            const actualIndex = this.imageHistory.length - 1 - index;

            return `
                <div class="history-item">
                    <div class="history-item-header">
                        <strong>Generated Image ${this.imageHistory.length - index}</strong>
                        <span class="history-item-time">${timestamp}</span>
                    </div>
                    <div class="history-item-content">
                        <div style="margin-bottom: 0.5rem;">
                            <img src="${image.image_url}" alt="Generated image" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">
                        </div>
                        <div><strong>Prompt:</strong> ${image.prompt.substring(0, 100)}${image.prompt.length > 100 ? '...' : ''}</div>
                        <div><strong>Size:</strong> ${image.size} | <strong>Style:</strong> ${image.style}</div>
                    </div>
                    <div class="history-item-actions">
                        <button class="history-action" onclick="app.downloadImage('${image.image_data}', '${image.prompt}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button class="history-action" onclick="app.viewImageFullscreen('${image.image_url}')">
                            <i class="fas fa-expand"></i> View
                        </button>
                        <button class="history-action" onclick="app.copyPrompt('${image.prompt}')">
                            <i class="fas fa-copy"></i> Copy Prompt
                        </button>
                        <button class="history-action danger" onclick="app.deleteImage(${actualIndex})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    restoreConversation(conversationIndex) {
        // This is a simplified implementation
        this.showToast('info', 'Conversation restore feature coming soon!');
    }

    deleteConversation(conversationIndex) {
        if (confirm('Are you sure you want to delete this conversation?')) {
            // This is a simplified implementation
            this.showToast('success', 'Conversation deleted');
            this.updateChatHistory();
        }
    }

    deleteImage(imageIndex) {
        if (confirm('Are you sure you want to delete this image?')) {
            this.imageHistory.splice(imageIndex, 1);
            this.saveToStorage();
            this.updateImageHistory();
            this.showToast('success', 'Image deleted');
        }
    }

    exportData() {
        const data = {
            chatHistory: this.chatHistory,
            imageHistory: this.imageHistory.map(img => ({
                ...img,
                image_data: null // Don't export large base64 data
            })),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-web-app-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
        this.showToast('success', 'Data exported successfully!');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (data.chatHistory) {
                    this.chatHistory = [...this.chatHistory, ...data.chatHistory];
                }

                if (data.imageHistory) {
                    this.imageHistory = [...this.imageHistory, ...data.imageHistory];
                }

                this.saveToStorage();
                this.updateHistoryDisplay();
                this.showToast('success', 'Data imported successfully!');

            } catch (error) {
                console.error('Error importing data:', error);
                this.showToast('error', 'Failed to import data. Invalid file format.');
            }
        };

        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            this.chatHistory = [];
            this.imageHistory = [];
            this.chatSessions = [];
            this.currentSessionId = null;
            this.saveToStorage();
            this.updateHistoryDisplay();

            // Clear chat display
            this.clearChatDisplay();

            // Clear generated images display
            const imagesContainer = document.getElementById('generated-images');
            imagesContainer.innerHTML = '';

            // Update sidebar
            this.updateChatSidebar();

            this.showToast('success', 'All data cleared successfully!');
        }
    }

    setLoading(isLoading, message = 'Loading...') {
        this.isLoading = isLoading;
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');

        if (isLoading) {
            loadingText.textContent = message;
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }

        // Update button states
        this.updateUI();
    }

    updateUI() {
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-button');
        const imagePrompt = document.getElementById('image-prompt');
        const generateButton = document.getElementById('generate-image');

        // Update chat UI
        if (chatInput && sendButton) {
            const chatLength = chatInput.value.length;
            sendButton.disabled = chatLength === 0 || chatLength > 2000 || this.isLoading;
        }

        // Update image UI
        if (imagePrompt && generateButton) {
            const promptLength = imagePrompt.value.length;
            generateButton.disabled = promptLength === 0 || promptLength > 1000 || this.isLoading;
        }
    }

    showToast(type, message, title = null) {
        const container = document.getElementById('toast-container');

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type] || icons.info}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title || titles[type] || 'Notification'}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add close functionality
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => {
            toast.remove();
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);

        container.appendChild(toast);
    }

    saveToStorage() {
        try {
            localStorage.setItem('ai-web-app-chat-history', JSON.stringify(this.chatHistory));
            localStorage.setItem('ai-web-app-image-history', JSON.stringify(this.imageHistory));
            localStorage.setItem('ai-web-app-chat-sessions', JSON.stringify(this.chatSessions));
            localStorage.setItem('ai-web-app-current-session', this.currentSessionId || '');
        } catch (error) {
            console.error('Error saving to storage:', error);
            this.showToast('warning', 'Failed to save data to local storage');
        }
    }

    loadStoredData() {
        try {
            const chatData = localStorage.getItem('ai-web-app-chat-history');
            const imageData = localStorage.getItem('ai-web-app-image-history');
            const sessionsData = localStorage.getItem('ai-web-app-chat-sessions');
            const currentSessionData = localStorage.getItem('ai-web-app-current-session');

            if (chatData) {
                this.chatHistory = JSON.parse(chatData);
            }

            if (imageData) {
                this.imageHistory = JSON.parse(imageData);
                this.restoreImageDisplay();
            }

            if (sessionsData) {
                this.chatSessions = JSON.parse(sessionsData);
            }

            if (currentSessionData) {
                this.currentSessionId = currentSessionData;
            }

            // If we have sessions, restore the current one
            if (this.chatSessions.length > 0) {
                if (!this.currentSessionId || !this.chatSessions.find(s => s.id === this.currentSessionId)) {
                    this.currentSessionId = this.chatSessions[0].id;
                }
                this.switchToSession(this.currentSessionId);
            } else if (this.chatHistory.length > 0) {
                // Migrate old chat history to sessions
                this.migrateOldChatHistory();
            }

        } catch (error) {
            console.error('Error loading stored data:', error);
            this.showToast('warning', 'Failed to load stored data');
        }
    }

    migrateOldChatHistory() {
        if (this.chatHistory.length === 0) return;

        // Create a session from old chat history
        const sessionId = 'session_migrated_' + Date.now();
        const firstUserMessage = this.chatHistory.find(m => m.role === 'user');
        const title = firstUserMessage ?
            firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '') :
            'Migrated Chat';

        const migratedSession = {
            id: sessionId,
            title: title,
            messages: [...this.chatHistory],
            createdAt: this.chatHistory[0]?.timestamp || new Date().toISOString(),
            lastUpdated: this.chatHistory[this.chatHistory.length - 1]?.timestamp || new Date().toISOString()
        };

        this.chatSessions = [migratedSession];
        this.currentSessionId = sessionId;
        this.switchToSession(sessionId);
        this.saveToStorage();
    }

    restoreChatDisplay() {
        if (this.chatHistory.length === 0) return;

        const messagesContainer = document.getElementById('chat-messages');
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');

        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        this.chatHistory.forEach(message => {
            this.addMessageToDisplay(message.role, message.content, message.timestamp);
        });
    }

    restoreImageDisplay() {
        if (this.imageHistory.length === 0) return;

        const container = document.getElementById('generated-images');

        // Display last few images
        this.imageHistory.slice(-5).reverse().forEach(image => {
            this.displayGeneratedImages([image]);
        });
    }

    addMessageToDisplay(role, content, timestamp) {
        const messagesContainer = document.getElementById('chat-messages');

        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date(timestamp).toLocaleTimeString();

        messageContent.appendChild(messageTime);
        messageElement.appendChild(avatar);
        messageElement.appendChild(messageContent);

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AIWebApp();
});
