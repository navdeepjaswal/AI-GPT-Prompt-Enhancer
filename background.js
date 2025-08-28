// Background service worker for AI Prompt Enhancer
// This script runs in the background and handles extension lifecycle events

// Configuration
const CONFIG = {
    maxRetries: 3,
    retryDelay: 1000,
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
    statsCheckInterval: 60 * 60 * 1000, // 1 hour
    maxStorageEntries: 100,
    dataRetentionDays: 30
};

// AbortController for cleanup
const abortController = new AbortController();

// Extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // First time installation
        console.log('AI Prompt Enhancer installed successfully!');
        
        try {
            // Set default settings
            chrome.storage.sync.set({
                enhanceClarity: true,
                addContext: true,
                improveStructure: false
            });
            
            // Open welcome page or show installation message
            chrome.tabs.create({
                url: chrome.runtime.getURL('welcome.html')
            });
        } catch (error) {
            console.error('Failed to complete installation setup:', error);
        }
    } else if (details.reason === 'update') {
        // Extension updated
        console.log('AI Prompt Enhancer updated to version', chrome.runtime.getManifest().version);
    }
});

// Extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('AI Prompt Enhancer started');
    
    try {
        // Initialize any background services
        initializeBackgroundServices();
    } catch (error) {
        console.error('Failed to initialize background services:', error);
    }
});

// Message handling from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    try {
        switch (request.action) {
            case 'enhancePrompt':
                handlePromptEnhancement(request.data, sendResponse);
                return true; // Keep message channel open for async response
                
            case 'getSettings':
                handleGetSettings(sendResponse);
                return true;
                
            case 'updateSettings':
                handleUpdateSettings(request.data, sendResponse);
                return true;
                
            case 'getStats':
                handleGetStats(sendResponse);
                return true;
                
            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: 'Internal server error' });
    }
});

// Handle prompt enhancement requests with retry logic
async function handlePromptEnhancement(data, sendResponse, retryCount = 0) {
    try {
        const { prompt, options } = data;
        
        if (!prompt || !prompt.trim()) {
            sendResponse({ success: false, error: 'No prompt provided' });
            return;
        }
        
        // Process the enhancement
        const enhancedPrompt = await processEnhancement(prompt, options);
        
        // Log usage for analytics
        await logUsage('prompt_enhanced', {
            originalLength: prompt.length,
            enhancedLength: enhancedPrompt.length,
            options: options,
            source: 'google_search'
        });
        
        sendResponse({ 
            success: true, 
            enhancedPrompt: enhancedPrompt,
            stats: {
                originalLength: prompt.length,
                enhancedLength: enhancedPrompt.length,
                improvement: Math.round(((enhancedPrompt.length - prompt.length) / prompt.length) * 100)
            }
        });
        
    } catch (error) {
        console.error('Error enhancing prompt:', error);
        
        // Retry logic for transient errors
        if (retryCount < CONFIG.maxRetries && 
            (error.message.includes('storage') || error.message.includes('quota'))) {
            
            console.log(`Retrying enhancement in ${CONFIG.retryDelay}ms... (attempt ${retryCount + 1})`);
            setTimeout(() => handlePromptEnhancement(data, sendResponse, retryCount + 1), CONFIG.retryDelay);
            return;
        }
        
        sendResponse({ success: false, error: error.message });
    }
}

// Process prompt enhancement
async function processEnhancement(prompt, options) {
    let enhanced = prompt;
    
    try {
        if (options.enhanceClarity) {
            enhanced = enhanceClarityLogic(enhanced);
        }
        
        if (options.addContext) {
            enhanced = addContextLogic(enhanced);
        }
        
        if (options.improveStructure) {
            enhanced = improveStructureLogic(enhanced);
        }
        
        return enhanced;
    } catch (error) {
        console.error('Error processing enhancement:', error);
        throw new Error('Failed to process prompt enhancement');
    }
}

// Enhancement logic functions
function enhanceClarityLogic(prompt) {
    let enhanced = prompt;
    
    try {
        if (!enhanced.toLowerCase().includes('please') && !enhanced.toLowerCase().includes('could you')) {
            enhanced = `Please ${enhanced}`;
        }
        
        if (!enhanced.toLowerCase().includes('format') && !enhanced.toLowerCase().includes('output')) {
            enhanced += '\n\nPlease provide a clear, well-structured response.';
        }
        
        return enhanced;
    } catch (error) {
        console.error('Error in clarity logic:', error);
        return prompt; // Return original if enhancement fails
    }
}

function addContextLogic(prompt) {
    let enhanced = prompt;
    
    try {
        if (!enhanced.toLowerCase().includes('as a') && !enhanced.toLowerCase().includes('acting as')) {
            enhanced = `As an AI assistant with expertise in this area, ${enhanced}`;
        }
        
        if (!enhanced.toLowerCase().includes('for') && !enhanced.toLowerCase().includes('targeting')) {
            enhanced += '\n\nPlease explain this in a way that would be helpful for someone learning about this topic.';
        }
        
        return enhanced;
    } catch (error) {
        console.error('Error in context logic:', error);
        return prompt; // Return original if enhancement fails
    }
}

function improveStructureLogic(prompt) {
    let enhanced = prompt;
    
    try {
        if (!enhanced.toLowerCase().includes('list') && !enhanced.toLowerCase().includes('bullet') && !enhanced.toLowerCase().includes('step')) {
            enhanced += '\n\nPlease organize your response with clear sections, bullet points, or numbered steps where appropriate.';
        }
        
        if (!enhanced.toLowerCase().includes('summary') && !enhanced.toLowerCase().includes('conclusion')) {
            enhanced += '\n\nPlease provide a brief summary or key takeaways at the end.';
        }
        
        return enhanced;
    } catch (error) {
        console.error('Error in structure logic:', error);
        return prompt; // Return original if enhancement fails
    }
}

// Handle settings retrieval
function handleGetSettings(sendResponse) {
    try {
        chrome.storage.sync.get(['enhanceClarity', 'addContext', 'improveStructure'], (result) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                return;
            }
            
            sendResponse({
                success: true,
                settings: {
                    enhanceClarity: result.enhanceClarity !== false,
                    addContext: result.addContext !== false,
                    improveStructure: result.improveStructure || false
                }
            });
        });
    } catch (error) {
        console.error('Error getting settings:', error);
        sendResponse({ success: false, error: 'Failed to retrieve settings' });
    }
}

// Handle settings update
function handleUpdateSettings(data, sendResponse) {
    try {
        chrome.storage.sync.set(data, () => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                return;
            }
            
            sendResponse({ success: true });
            
            // Log settings change
            logUsage('settings_updated', data).catch(console.error);
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        sendResponse({ success: false, error: 'Failed to update settings' });
    }
}

// Handle statistics retrieval
function handleGetStats(sendResponse) {
    try {
        chrome.storage.local.get(['usageStats', 'totalPrompts', 'totalEnhancements', 'lastUpdated'], (result) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                return;
            }
            
            sendResponse({
                success: true,
                stats: {
                    totalPrompts: result.totalPrompts || 0,
                    totalEnhancements: result.totalEnhancements || 0,
                    lastUpdated: result.lastUpdated || 0,
                    usageStats: result.usageStats || {}
                }
            });
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        sendResponse({ success: false, error: 'Failed to retrieve statistics' });
    }
}

// Log usage for analytics with better error handling
async function logUsage(action, data = {}) {
    try {
        const timestamp = Date.now();
        
        const result = await new Promise((resolve, reject) => {
            chrome.storage.local.get(['usageStats', 'totalPrompts', 'totalEnhancements'], (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve(result);
            });
        });
        
        const usageStats = result.usageStats || {};
        const totalPrompts = result.totalPrompts || 0;
        const totalEnhancements = result.totalEnhancements || 0;
        
        // Update usage stats
        if (!usageStats[action]) {
            usageStats[action] = [];
        }
        
        usageStats[action].push({
            timestamp,
            data
        });
        
        // Keep only last N entries per action to prevent storage bloat
        if (usageStats[action].length > CONFIG.maxStorageEntries) {
            usageStats[action] = usageStats[action].slice(-CONFIG.maxStorageEntries);
        }
        
        // Update totals
        let newTotalPrompts = totalPrompts;
        let newTotalEnhancements = totalEnhancements;
        
        if (action === 'prompt_enhanced') {
            newTotalPrompts++;
            newTotalEnhancements++;
        }
        
        // Save updated stats
        await new Promise((resolve, reject) => {
            chrome.storage.local.set({
                usageStats,
                totalPrompts: newTotalPrompts,
                totalEnhancements: newTotalEnhancements,
                lastUpdated: timestamp
            }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve();
            });
        });
        
    } catch (error) {
        console.error('Error logging usage:', error);
        // Don't throw - logging failures shouldn't break the main functionality
    }
}

// Initialize background services with proper cleanup
function initializeBackgroundServices() {
    try {
        // Set up periodic cleanup of old usage data
        const cleanupInterval = setInterval(() => {
            if (abortController.signal.aborted) {
                clearInterval(cleanupInterval);
                return;
            }
            cleanupOldUsageData().catch(console.error);
        }, CONFIG.cleanupInterval);
        
        // Set up periodic stats reset (optional)
        const statsInterval = setInterval(() => {
            if (abortController.signal.aborted) {
                clearInterval(statsInterval);
                return;
            }
            checkAndResetMonthlyStats().catch(console.error);
        }, CONFIG.statsCheckInterval);
        
        // Store intervals for cleanup
        window.cleanupInterval = cleanupInterval;
        window.statsInterval = statsInterval;
        
    } catch (error) {
        console.error('Failed to initialize background services:', error);
    }
}

// Clean up old usage data (older than N days)
async function cleanupOldUsageData() {
    try {
        const cutoffDate = Date.now() - (CONFIG.dataRetentionDays * 24 * 60 * 60 * 1000);
        
        const result = await new Promise((resolve, reject) => {
            chrome.storage.local.get(['usageStats'], (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve(result);
            });
        });
        
        const usageStats = result.usageStats || {};
        let cleaned = false;
        
        Object.keys(usageStats).forEach(action => {
            usageStats[action] = usageStats[action].filter(entry => 
                entry.timestamp > cutoffDate
            );
            
            if (usageStats[action].length === 0) {
                delete usageStats[action];
                cleaned = true;
            }
        });
        
        if (cleaned) {
            await new Promise((resolve, reject) => {
                chrome.storage.local.set({ usageStats }, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    resolve();
                });
            });
            
            console.log('Cleaned up old usage data');
        }
        
    } catch (error) {
        console.error('Error cleaning up old usage data:', error);
    }
}

// Check and reset monthly stats if needed
async function checkAndResetMonthlyStats() {
    try {
        const result = await new Promise((resolve, reject) => {
            chrome.storage.local.get(['lastMonthlyReset'], (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve(result);
            });
        });
        
        const lastReset = result.lastMonthlyReset || 0;
        const now = Date.now();
        const oneMonth = 30 * 24 * 60 * 60 * 1000;
        
        if (now - lastReset > oneMonth) {
            // Reset monthly stats
            await new Promise((resolve, reject) => {
                chrome.storage.local.set({
                    monthlyPrompts: 0,
                    monthlyEnhancements: 0,
                    lastMonthlyReset: now
                }, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    resolve();
                });
            });
            
            console.log('Monthly stats reset');
        }
        
    } catch (error) {
        console.error('Error checking monthly stats:', error);
    }
}

// Handle tab updates to inject content scripts on Google pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (abortController.signal.aborted) return;
    
    if (changeInfo.status === 'complete' && tab.url && 
        (tab.url.includes('google.com') || tab.url.includes('google.co.uk') || tab.url.includes('google.ca'))) {
        
        // Inject content script if not already injected
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        }).catch((error) => {
            // Script might already be injected, ignore error
            console.log('Content script injection skipped (likely already present):', error.message);
        });
    }
});

// Handle extension uninstall
chrome.runtime.setUninstallURL('https://your-website.com/uninstall-feedback');

// Cleanup on service worker termination
self.addEventListener('beforeunload', () => {
    try {
        abortController.abort();
        
        // Clear intervals
        if (window.cleanupInterval) {
            clearInterval(window.cleanupInterval);
        }
        if (window.statsInterval) {
            clearInterval(window.statsInterval);
        }
        
        console.log('Background service worker cleanup completed');
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        processEnhancement,
        enhanceClarityLogic,
        addContextLogic,
        improveStructureLogic
    };
}
