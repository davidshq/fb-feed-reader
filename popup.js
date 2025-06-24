// Popup script for Facebook Feed Reader
document.addEventListener('DOMContentLoaded', function() {
    const checkedCountElement = document.getElementById('checkedCount');
    const clearButton = document.getElementById('clearButton');
    const refreshButton = document.getElementById('refreshButton');

    // Load the count when popup opens
    loadCheckedCount();

    // Clear button event
    clearButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all checked items? This will make all previously checked items visible again.')) {
            chrome.storage.local.remove(['checkedItems'], function() {
                checkedCountElement.textContent = '0';
                // Notify content script to refresh
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0] && tabs[0].url && tabs[0].url.includes('facebook.com')) {
                        chrome.tabs.sendMessage(tabs[0].id, {action: 'refresh'});
                    }
                });
            });
        }
    });

    // Refresh button event
    refreshButton.addEventListener('click', function() {
        loadCheckedCount();
    });

    function loadCheckedCount() {
        chrome.storage.local.get(['checkedItems'], function(result) {
            const count = result.checkedItems ? result.checkedItems.length : 0;
            checkedCountElement.textContent = count.toString();
        });
    }
}); 