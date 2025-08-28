// Popup script for AI Prompt Enhancer
document.addEventListener('DOMContentLoaded', function() {
    console.log('AI Prompt Enhancer popup loaded');
    
    // Get elements
    const statusElement = document.getElementById('status');
    const statsElement = document.getElementById('stats');
    const settingsElement = document.getElementById('settings');
    
    // Show initial status
    if (statusElement) {
        statusElement.textContent = 'Extension is active!';
        statusElement.style.color = '#28a745';
    }
    
    // Load and display stats
    loadStats();
    
    // Load and display settings
    loadSettings();
});

// Load statistics from background script
function loadStats() {
    chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
        if (response && response.success && statsElement) {
            const stats = response.stats;
            statsElement.innerHTML = `
                <h3>Usage Statistics</h3>
                <p><strong>Total Prompts:</strong> ${stats.totalPrompts}</p>
                <p><strong>Total Enhancements:</strong> ${stats.totalEnhancements}</p>
                <p><strong>Last Updated:</strong> ${stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Never'}</p>
            `;
        } else {
            if (statsElement) {
                statsElement.innerHTML = '<p>Unable to load statistics</p>';
            }
        }
    });
}

// Load settings from background script
function loadSettings() {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        if (response && response.success && settingsElement) {
            const settings = response.settings;
            settingsElement.innerHTML = `
                <h3>Current Settings</h3>
                <p><strong>Enhance Clarity:</strong> ${settings.enhanceClarity ? '✅ Enabled' : '❌ Disabled'}</p>
                <p><strong>Add Context:</strong> ${settings.addContext ? '✅ Enabled' : '❌ Disabled'}</p>
                <p><strong>Improve Structure:</strong> ${settings.improveStructure ? '✅ Enabled' : '❌ Disabled'}</p>
            `;
        } else {
            if (settingsElement) {
                settingsElement.innerHTML = '<p>Unable to load settings</p>';
            }
        }
    });
}

// Test the extension functionality
function testExtension() {
    console.log('Testing extension...');
    
    // Send a test message to background script
    chrome.runtime.sendMessage({ 
        action: 'enhancePrompt', 
        data: { 
            prompt: 'Hello world', 
            options: { enhanceClarity: true, addContext: true, improveStructure: false } 
        } 
    }, (response) => {
        if (response && response.success) {
            console.log('Test successful:', response);
            alert('Extension test successful! Enhanced prompt: ' + response.enhancedPrompt);
        } else {
            console.error('Test failed:', response);
            alert('Extension test failed: ' + (response?.error || 'Unknown error'));
        }
    });
}

// Add test button if it doesn't exist
if (document.getElementById('testBtn')) {
    document.getElementById('testBtn').addEventListener('click', testExtension);
}
