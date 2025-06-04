class ImageGenerator {
    constructor() {
        this.isLoading = false;
        this.mobileNavOpen = false;
        this.isMobile = window.innerWidth <= 768;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCharCounters();
    }

    setupEventListeners() {
        // Form elements
        const promptInput = document.getElementById('prompt');
        const negativePromptInput = document.getElementById('negative-prompt');
        const generateBtn = document.getElementById('generate');
        const advancedToggle = document.getElementById('advanced-toggle');
        const guidanceScale = document.getElementById('guidance-scale');
        const steps = document.getElementById('steps');
        const randomSeedBtn = document.getElementById('random-seed');

        // Event listeners
        promptInput.addEventListener('input', () => this.updateCharCounters());
        negativePromptInput.addEventListener('input', () => this.updateCharCounters());
        generateBtn.addEventListener('click', () => this.generateImage());
        advancedToggle.addEventListener('click', () => this.toggleAdvancedSettings());
        
        // Range sliders
        guidanceScale.addEventListener('input', (e) => {
            document.getElementById('guidance-value').textContent = e.target.value;
        });
        
        steps.addEventListener('input', (e) => {
            document.getElementById('steps-value').textContent = e.target.value;
        });
        
        randomSeedBtn.addEventListener('click', () => this.generateRandomSeed());

        // Enter key support
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.generateImage();
            }
        });

        // Mobile navigation functionality
        const mobileNavToggle = document.getElementById('mobile-nav-toggle');
        if (mobileNavToggle) {
            mobileNavToggle.addEventListener('click', () => this.toggleMobileNav());
        }

        // Window resize handler for responsive behavior
        window.addEventListener('resize', () => this.handleResize());

        // Close mobile nav when clicking outside
        document.addEventListener('click', (e) => {
            if (this.mobileNavOpen && !e.target.closest('.nav-tabs') && !e.target.closest('.mobile-nav-toggle')) {
                this.closeMobileNav();
            }
        });
    }

    updateCharCounters() {
        const promptInput = document.getElementById('prompt');
        const negativePromptInput = document.getElementById('negative-prompt');
        const generateBtn = document.getElementById('generate');
        
        // Update prompt counter
        const promptLength = promptInput.value.length;
        const promptCounter = promptInput.parentElement.querySelector('.char-counter');
        promptCounter.textContent = `${promptLength}/1000`;
        
        // Update negative prompt counter
        const negativeLength = negativePromptInput.value.length;
        const negativeCounter = negativePromptInput.parentElement.querySelector('.char-counter');
        negativeCounter.textContent = `${negativeLength}/500`;
        
        // Enable/disable generate button
        generateBtn.disabled = promptLength === 0 || promptLength > 1000 || this.isLoading;
    }

    toggleAdvancedSettings() {
        const advancedSettings = document.getElementById('advanced-settings');
        const chevron = document.querySelector('#advanced-toggle i:last-child');
        
        advancedSettings.classList.toggle('open');
        
        if (advancedSettings.classList.contains('open')) {
            chevron.style.transform = 'rotate(180deg)';
        } else {
            chevron.style.transform = 'rotate(0deg)';
        }
    }

    generateRandomSeed() {
        const seedInput = document.getElementById('seed');
        const randomSeed = Math.floor(Math.random() * 1000000);
        seedInput.value = randomSeed;
    }

    async generateImage() {
        if (this.isLoading) return;

        const promptInput = document.getElementById('prompt');
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            this.showToast('Please enter a prompt', 'error');
            return;
        }

        this.setLoading(true);

        try {
            const requestData = this.getFormData();
            console.log('Sending request:', requestData);

            const response = await fetch('/api/images/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to generate image');
            }

            const data = await response.json();
            console.log('Response received:', data);
            
            this.displayResults(data.images);
            this.showToast('Images generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating image:', error);
            this.showToast(error.message || 'Failed to generate image', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    getFormData() {
        const prompt = document.getElementById('prompt').value.trim();
        const negativePrompt = document.getElementById('negative-prompt').value.trim();
        const model = document.getElementById('model').value;
        const size = document.getElementById('size').value;
        const style = document.getElementById('style').value;
        const numImages = parseInt(document.getElementById('num-images').value);
        const guidanceScale = parseFloat(document.getElementById('guidance-scale').value);
        const steps = parseInt(document.getElementById('steps').value);
        const seed = document.getElementById('seed').value;

        return {
            prompt,
            negative_prompt: negativePrompt,
            model,
            size,
            style,
            num_images: numImages,
            guidance_scale: guidanceScale,
            steps,
            seed: seed ? parseInt(seed) : null
        };
    }

    setLoading(loading) {
        this.isLoading = loading;
        const generateBtn = document.getElementById('generate');
        const loadingDiv = document.getElementById('loading');
        const resultsDiv = document.getElementById('results');

        if (loading) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

            // Show typing-style indicator instead of modal
            this.showGeneratingIndicator();
        } else {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Image';
            loadingDiv.style.display = 'none';

            // Remove generating indicator
            this.hideGeneratingIndicator();
        }

        this.updateCharCounters();
    }

    showGeneratingIndicator() {
        const resultsDiv = document.getElementById('results');

        // Remove any existing indicator
        this.hideGeneratingIndicator();

        const indicatorElement = document.createElement('div');
        indicatorElement.className = 'generating-indicator';
        indicatorElement.id = 'generating-indicator';

        indicatorElement.innerHTML = `
            <div class="generating-content">
                <div class="generating-icon">
                    <i class="fas fa-magic"></i>
                </div>
                <div class="generating-text">
                    <span>AI is generating your image</span>
                    <div class="generating-dots">
                        <div class="generating-dot"></div>
                        <div class="generating-dot"></div>
                        <div class="generating-dot"></div>
                    </div>
                </div>
            </div>
        `;

        resultsDiv.appendChild(indicatorElement);
    }

    hideGeneratingIndicator() {
        const indicator = document.getElementById('generating-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    displayResults(images) {
        const resultsDiv = document.getElementById('results');
        const loadingDiv = document.getElementById('loading');
        
        // Remove loading indicator
        loadingDiv.style.display = 'none';
        
        images.forEach(image => {
            const imageElement = this.createImageElement(image);
            resultsDiv.insertBefore(imageElement, resultsDiv.firstChild);
        });
    }

    createImageElement(image) {
        const div = document.createElement('div');
        div.className = 'image-result';
        
        const params = image.generation_params || {};
        const originalPrompt = params.original_prompt || image.prompt;
        const model = params.model || 'Unknown Model';
        const size = params.size || 'Unknown Size';
        const steps = params.steps || 'N/A';
        const guidance = params.guidance_scale || 'N/A';
        
        div.innerHTML = `
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
                    <button class="image-action" onclick="imageGenerator.downloadImage('${image.image_data}', '${originalPrompt}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="image-action" onclick="imageGenerator.viewFullscreen('${image.image_url}')">
                        <i class="fas fa-expand"></i> View Full
                    </button>
                    <button class="image-action" onclick="imageGenerator.copyPrompt('${originalPrompt}')">
                        <i class="fas fa-copy"></i> Copy Prompt
                    </button>
                    <button class="image-action" onclick="imageGenerator.copySettings('${JSON.stringify(params).replace(/'/g, "\\'")}')">
                        <i class="fas fa-cog"></i> Copy Settings
                    </button>
                </div>
            </div>
        `;
        
        return div;
    }

    downloadImage(imageData, prompt) {
        try {
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${imageData}`;
            link.download = `ai-image-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.showToast('Image downloaded!', 'success');
        } catch (error) {
            this.showToast('Failed to download image', 'error');
        }
    }

    viewFullscreen(imageUrl) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
        `;
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
        `;
        
        modal.appendChild(img);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    copyPrompt(prompt) {
        navigator.clipboard.writeText(prompt).then(() => {
            this.showToast('Prompt copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy prompt', 'error');
        });
    }

    copySettings(paramsJson) {
        try {
            const params = JSON.parse(paramsJson);
            
            // Apply settings to form
            if (params.model) document.getElementById('model').value = params.model;
            if (params.size) document.getElementById('size').value = params.size;
            if (params.style) document.getElementById('style').value = params.style;
            if (params.guidance_scale) {
                const guidanceInput = document.getElementById('guidance-scale');
                guidanceInput.value = params.guidance_scale;
                document.getElementById('guidance-value').textContent = params.guidance_scale;
            }
            if (params.steps) {
                const stepsInput = document.getElementById('steps');
                stepsInput.value = params.steps;
                document.getElementById('steps-value').textContent = params.steps;
            }
            if (params.seed) document.getElementById('seed').value = params.seed;
            
            this.showToast('Settings copied to form!', 'success');
        } catch (error) {
            this.showToast('Failed to copy settings', 'error');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');

        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    // Mobile Navigation Methods
    toggleMobileNav() {
        this.mobileNavOpen = !this.mobileNavOpen;
        const navTabs = document.getElementById('nav-tabs');
        const mobileNavToggle = document.getElementById('mobile-nav-toggle');

        if (this.mobileNavOpen) {
            navTabs.classList.add('mobile-open');
            mobileNavToggle.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            navTabs.classList.remove('mobile-open');
            mobileNavToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    }

    closeMobileNav() {
        if (this.mobileNavOpen) {
            this.mobileNavOpen = false;
            const navTabs = document.getElementById('nav-tabs');
            const mobileNavToggle = document.getElementById('mobile-nav-toggle');

            navTabs.classList.remove('mobile-open');
            mobileNavToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    }

    // Handle window resize for responsive behavior
    handleResize() {
        const newIsMobile = window.innerWidth <= 768;

        if (newIsMobile !== this.isMobile) {
            this.isMobile = newIsMobile;

            // Close mobile nav when switching to desktop
            if (!this.isMobile) {
                this.closeMobileNav();
            }
        }
    }
}

// Initialize the image generator when the page loads
const imageGenerator = new ImageGenerator();
