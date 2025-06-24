// Background service worker for Facebook Feed Reader
chrome.runtime.onInstalled.addListener(() => {
  console.log('Facebook Feed Reader extension installed');
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCheckedItemsCount') {
    chrome.storage.local.get(['checkedItems'], (result) => {
      const count = result.checkedItems ? result.checkedItems.length : 0;
      sendResponse({ count });
    });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'clearCheckedItems') {
    chrome.storage.local.remove(['checkedItems'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
}); 