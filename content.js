// AI Prompt Enhancer - Google Search Bar Integration
// This script integrates with Google's search interface to provide prompt enhancement

(function() {
    'use strict';
    
    // Configuration
    const config = {
        buttonClass: 'ai-enhancer-button',
        modalClass: 'ai-enhancer-modal',
        searchBarSelectors: [
            'input[name="q"]',
            'textarea[name="q"]',
            '.gLFyf',
            '[aria-label="Search"]',
            '[data-ved]'
        ],
        debounceDelay: 100,
        maxRetries: 3,
        retryDelay: 1000
    };
    
    // State management
    let isModalOpen = false;
    let currentSearchBar = null;
    let enhancementButton = null;
    let enhancementModal = null;
    let isInitialized = false;
    
    // AbortController for cleanup
    const abortController = new AbortController();
    
    // Initialize the extension
    function init() {
        if (isInitialized) return;
        
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupEnhancement, { signal: abortController.signal });
            } else {
                setupEnhancement();
            }
            
            // Handle clicks outside modal to close it
            document.addEventListener('click', handleOutsideClick, { signal: abortController.signal });
            
            isInitialized = true;
            console.log('AI Prompt Enhancer initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AI Prompt Enhancer:', error);
        }
    }
    
    // Set up enhancement functionality
    function setupEnhancement() {
        try {
            const searchBar = findGoogleSearchBar();
            
            if (searchBar && !searchBar.classList.contains('ai-enhanced')) {
                currentSearchBar = searchBar;
                addEnhancementButton(searchBar);
                searchBar.classList.add('ai-enhanced');
            }
        } catch (error) {
            console.error('Failed to setup enhancement:', error);
        }
    }
    
    // Find Google's search input with improved detection and retry logic
    function findGoogleSearchBar(retryCount = 0) {
        try {
            // Try multiple approaches to find the search bar
            for (const selector of config.searchBarSelectors) {
                try {
                    const element = document.querySelector(selector);
                    if (element && element.offsetParent !== null && element.offsetWidth > 0) {
                        return element;
                    }
                } catch (e) {
                    console.warn(`Selector "${selector}" failed:`, e);
                }
            }
            
            // Fallback: look for any input that looks like a search bar
            const inputs = document.querySelectorAll('input[type="text"], textarea');
            for (const input of inputs) {
                if (input.offsetParent !== null && 
                    input.offsetWidth > 200 && 
                    input.offsetHeight > 30 &&
                    (input.placeholder?.toLowerCase().includes('search') || 
                     input.placeholder?.toLowerCase().includes('google') ||
                     input.getAttribute('aria-label')?.toLowerCase().includes('search'))) {
                    return input;
                }
            }
            
            // Retry logic for dynamic content
            if (retryCount < config.maxRetries) {
                console.log(`Search bar not found, retrying in ${config.retryDelay}ms... (attempt ${retryCount + 1})`);
                setTimeout(() => findGoogleSearchBar(retryCount + 1), config.retryDelay);
            } else {
                console.warn('Search bar not found after maximum retries');
            }
            
            return null;
        } catch (error) {
            console.error('Error finding search bar:', error);
            return null;
        }
    }
    
    // Add enhancement button to the search bar
    function addEnhancementButton(searchBar) {
        try {
            // Create enhancement button
            enhancementButton = document.createElement('button');
            enhancementButton.type = 'button';
            enhancementButton.className = config.buttonClass;
            enhancementButton.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                AI Enhance
            `;
            
            // Add click handler
            enhancementButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleModal();
            }, { signal: abortController.signal });
            
            // Position the button relative to the search bar
            positionButton(enhancementButton, searchBar);
            
            // Add button to the page
            document.body.appendChild(enhancementButton);
            
            // Create the modal immediately (don't wait for click)
            createEnhancementModal();
        } catch (error) {
            console.error('Failed to add enhancement button:', error);
        }
    }
    
    // Create the enhancement modal
    function createEnhancementModal() {
        if (enhancementModal) return; // Prevent recreation
        
        try {
            const modalHTML = `
                <div class="ai-enhancer-modal" id="ai-enhancer-modal">
                    <div class="modal-header">
                        <h3>✨ AI Prompt Enhancer</h3>
                        <p>Enter your prompt and click Enhance to improve it</p>
                    </div>
                    
                    <div class="modal-content">
                        <div class="input-section">
                            <label for="prompt-input">Your Prompt:</label>
                            <textarea 
                                id="prompt-input" 
                                placeholder="Enter your AI prompt here..."
                                rows="6"
                            ></textarea>
                        </div>
                        
                        <div class="modal-actions">
                            <button id="enhance-btn" class="enhance-btn">
                                <span class="loading-spinner" style="display: none;"></span>
                                Enhance
                            </button>
                        </div>
                        
                        <div class="result-section" id="result-section" style="display: none;">
                            <h4>Enhanced Prompt:</h4>
                            <div class="result-content" id="result-content"></div>
                        </div>
                    </div>
                </div>
            `;
            
            // Create a temporary container to parse the HTML
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = modalHTML;
            
            // Get the modal element
            enhancementModal = tempContainer.firstElementChild;
            
            // Append to body
            document.body.appendChild(enhancementModal);
            
            if (enhancementModal) {
                setupModalEvents();
            }
        } catch (error) {
            console.error('Failed to create enhancement modal:', error);
        }
    }
    
    // Set up modal event listeners (only once)
    function setupModalEvents() {
        if (!enhancementModal) return;
        
        try {
            const enhanceBtn = enhancementModal.querySelector('#enhance-btn');
            
            // Event listeners
            if (enhanceBtn) {
                enhanceBtn.addEventListener('click', () => enhancePrompt(), { signal: abortController.signal });
            }
        } catch (error) {
            console.error('Failed to setup modal events:', error);
        }
    }
    
    // Toggle modal visibility
    function toggleModal() {
        if (isModalOpen) {
            closeModal();
        } else {
            openModal();
        }
    }
    
    // Open the enhancement modal
    function openModal() {
        if (!enhancementModal) return;
        
        try {
            // Position the modal before showing it
            positionModal();
            
            // Show the modal
            enhancementModal.classList.add('show');
            isModalOpen = true;
            
            // Focus on the input
            const promptInput = enhancementModal.querySelector('#prompt-input');
            if (promptInput) {
                promptInput.focus();
            }
        } catch (error) {
            console.error('Failed to open modal:', error);
        }
    }
    
    // Close the modal
    function closeModal() {
        if (!enhancementModal) return;
        
        try {
            isModalOpen = false;
            enhancementModal.classList.remove('show');
            
            // Clear result section
            const resultSection = enhancementModal.querySelector('#result-section');
            if (resultSection) {
                resultSection.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to close modal:', error);
        }
    }
    
    // Handle clicks outside modal to close it
    function handleOutsideClick(event) {
        if (isModalOpen && 
            !enhancementModal.contains(event.target) && 
            !enhancementButton.contains(event.target)) {
            closeModal();
        }
    }
    
    // Position the enhancement button
    function positionButton(button, searchBar) {
        if (!button || !searchBar) return;
        
        try {
            const rect = searchBar.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            button.style.position = 'absolute';
            button.style.left = (rect.right - 120) + scrollLeft + 'px';
            button.style.top = (rect.top + scrollTop) + 'px';
        } catch (error) {
            console.error('Failed to position button:', error);
        }
    }
    
    // Position the modal (centered on screen)
    function positionModal() {
        if (!enhancementModal) return;
        
        try {
            // Modal is already centered using CSS transform
            // Just ensure it's visible and properly sized
            enhancementModal.style.display = 'block';
        } catch (error) {
            console.error('Failed to position modal:', error);
        }
    }
    
    // Enhanced prompt function that uses background script with retry logic
    async function enhancePrompt(retryCount = 0) {
        if (!enhancementModal) return;
        
        const promptInput = enhancementModal.querySelector('#prompt-input');
        const enhanceBtn = enhancementModal.querySelector('#enhance-btn');
        const resultSection = enhancementModal.querySelector('#result-section');
        const resultContent = enhancementModal.querySelector('#result-content');
        
        if (!promptInput || !enhanceBtn) return;
        
        try {
            // Show loading state
            enhanceBtn.disabled = true;
            enhanceBtn.innerHTML = '<span class="loading-spinner"></span> Enhancing...';
            
            // Hide previous results
            if (resultSection) {
                resultSection.style.display = 'none';
            }
            
            // Send message to background script to handle the enhancement
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'enhancePrompt',
                    data: {
                        prompt: promptInput.value.trim() || 'Hello world',
                        options: {
                            enhanceClarity: true,
                            addContext: true,
                            improveStructure: false
                        }
                    }
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            });
            
            if (response.success) {
                // Display the enhanced result
                if (resultContent) {
                    resultContent.textContent = response.enhancedPrompt;
                }
                if (resultSection) {
                    resultSection.style.display = 'block';
                }
                
                showNotification('Prompt enhanced successfully!', 'success');
                
                // Log the enhancement
                console.log('Enhancement stats:', response.stats);
            } else {
                throw new Error(response.error || 'Enhancement failed');
            }
            
        } catch (error) {
            console.error('Error enhancing prompt:', error);
            
            // Retry logic for transient errors
            if (retryCount < config.maxRetries && 
                (error.message.includes('Could not establish connection') || 
                 error.message.includes('Extension context invalidated'))) {
                
                console.log(`Retrying enhancement in ${config.retryDelay}ms... (attempt ${retryCount + 1})`);
                setTimeout(() => enhancePrompt(retryCount + 1), config.retryDelay);
                return;
            }
            
            showNotification('Failed to enhance prompt: ' + error.message, 'error');
        } finally {
            // Reset button state
            enhanceBtn.disabled = false;
            enhanceBtn.textContent = 'Enhance';
        }
    }
    
    // Show notification with improved styling and accessibility
    function showNotification(message, type = 'info') {
        try {
            const notification = document.createElement('div');
            notification.className = 'ai-enhancer-notification';
            notification.textContent = message;
            notification.setAttribute('role', 'alert');
            notification.setAttribute('aria-live', 'polite');
            
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                font-weight: 500;
                z-index: 10000;
                max-width: 300px;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            `;
            
            if (type === 'success') {
                notification.style.background = '#28a745';
            } else if (type === 'error') {
                notification.style.background = '#dc3545';
            } else {
                notification.style.background = '#17a2b8';
            }
            
            document.body.appendChild(notification);
            
            // Auto-remove after 4 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, 4000);
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }
    
    // Add CSS animations
    function addStyles() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                
                .ai-enhancer-button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    transition: all 0.2s ease;
                    z-index: 1000;
                }
                
                .ai-enhancer-button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }
                
                .ai-enhancer-button .icon {
                    width: 16px;
                    height: 16px;
                }
                
                .ai-enhancer-modal {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                    z-index: 10000;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    display: none;
                }
                
                .ai-enhancer-modal.show {
                    display: block;
                }
                
                .modal-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 12px 12px 0 0;
                }
                
                .modal-header h3 {
                    margin: 0 0 8px 0;
                    font-size: 18px;
                }
                
                .modal-header p {
                    margin: 0;
                    opacity: 0.9;
                    font-size: 14px;
                }
                
                .modal-content {
                    padding: 20px;
                }
                
                .input-section {
                    margin-bottom: 20px;
                }
                
                .input-section label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #333;
                }
                
                .input-section textarea {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: inherit;
                    resize: vertical;
                    transition: border-color 0.3s ease;
                }
                
                .input-section textarea:focus {
                    outline: none;
                    border-color: #667eea;
                }
                
                .modal-actions {
                    text-align: center;
                    margin-bottom: 20px;
                }
                
                .enhance-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .enhance-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
                }
                
                .enhance-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .result-section {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 16px;
                    border-left: 4px solid #667eea;
                }
                
                .result-section h4 {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    color: #333;
                }
                
                .result-content {
                    background: white;
                    padding: 12px;
                    border-radius: 6px;
                    border: 1px solid #e1e5e9;
                    font-size: 14px;
                    line-height: 1.5;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    max-height: 200px;
                    overflow-y: auto;
                }
                
                .loading-spinner {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    border-top-color: transparent;
                    animation: spin 1s ease-in-out infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        } catch (error) {
            console.error('Failed to add styles:', error);
        }
    }
    
    // Initialize the content script
    try {
        addStyles();
        init();
    } catch (error) {
        console.error('Failed to initialize content script:', error);
    }
    
    // Cleanup function for when the script is unloaded
    window.addEventListener('beforeunload', () => {
        try {
            abortController.abort();
            if (enhancementButton) enhancementButton.remove();
            if (enhancementModal) enhancementModal.remove();
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    });
    
})();
