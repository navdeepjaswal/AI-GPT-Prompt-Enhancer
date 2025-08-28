// Welcome page functionality for AI Prompt Enhancer

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const startBtn = document.getElementById('start-btn');
    const helpLink = document.getElementById('help-link');
    const feedbackLink = document.getElementById('feedback-link');
    
    // Event listeners
    if (startBtn) {
        startBtn.addEventListener('click', closeWelcome);
    }
    
    if (helpLink) {
        helpLink.addEventListener('click', openHelp);
    }
    
    if (feedbackLink) {
        feedbackLink.addEventListener('click', openFeedback);
    }
    
    // Auto-close after 30 seconds
    setTimeout(() => {
        if (window.close) {
            window.close();
        }
    }, 30000);
});

// Close welcome window
function closeWelcome() {
    if (window.close) {
        window.close();
    }
}

// Open help documentation
function openHelp() {
    // You can replace this with your help documentation URL
    window.open('https://your-website.com/help', '_blank');
}

// Open feedback form
function openFeedback() {
    // You can replace this with your feedback form URL
    window.open('https://your-website.com/feedback', '_blank');
}
