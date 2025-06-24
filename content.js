// Facebook Feed Reader Content Script
class FacebookFeedReader {
  constructor() {
    this.checkedItems = new Set();
    this.observer = null;
    this.processedItems = new Set();
    this.isProcessing = false;
    this.init();
  }

  async init() {
    console.log('Facebook Feed Reader: Initializing...');
    // Load previously checked items from storage
    await this.loadCheckedItems();
    
    // Clean up invalid IDs
    await this.cleanupInvalidIds();
    
    // Start observing for new feed items
    this.startObserver();
    
    // Process existing feed items with delay to avoid React conflicts
    setTimeout(() => {
      this.processFeedItems();
    }, 2000);
  }

  async loadCheckedItems() {
    try {
      const result = await chrome.storage.local.get(['checkedItems']);
      if (result.checkedItems) {
        this.checkedItems = new Set(result.checkedItems);
        console.log('Facebook Feed Reader: Loaded', this.checkedItems.size, 'checked items');
      }
    } catch (error) {
      console.error('Error loading checked items:', error);
    }
  }

  async cleanupInvalidIds() {
    const originalSize = this.checkedItems.size;
    const validItems = new Set();
    
    for (const itemId of this.checkedItems) {
      if (this.isValidItemId(itemId)) {
        validItems.add(itemId);
      } else {
        console.log('Facebook Feed Reader: Removing invalid ID:', itemId);
      }
    }
    
    this.checkedItems = validItems;
    
    if (originalSize !== this.checkedItems.size) {
      console.log('Facebook Feed Reader: Cleaned up', originalSize - this.checkedItems.size, 'invalid IDs');
      await this.saveCheckedItems();
    }
  }

  async saveCheckedItems() {
    try {
      await chrome.storage.local.set({
        checkedItems: Array.from(this.checkedItems)
      });
    } catch (error) {
      console.error('Error saving checked items:', error);
    }
  }

  startObserver() {
    // Create a mutation observer to watch for new feed items
    this.observer = new MutationObserver((mutations) => {
      if (this.isProcessing) return; // Prevent overlapping processing
      
      let shouldProcess = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes contain feed items
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (this.isFeedItem(node) || node.querySelector('[role="article"][aria-posinset]')) {
                shouldProcess = true;
              }
            }
          });
        }
      });

      if (shouldProcess) {
        // Debounce the processing to avoid excessive calls
        clearTimeout(this.processTimeout);
        this.processTimeout = setTimeout(() => {
          this.processFeedItems();
        }, 500);
      }
    });

    // Start observing the document body
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log('Facebook Feed Reader: Observer started');
  }

  isFeedItem(element) {
    // Check if element is a feed item based on Facebook's structure
    return element.matches && (
      element.matches('[role="article"][aria-posinset]') ||
      element.matches('[data-pagelet*="FeedUnit"]') ||
      element.matches('[data-testid*="post"]') ||
      element.matches('[role="article"]') ||
      element.matches('div[data-testid="post_container"]') ||
      element.matches('div[data-testid="post_message"]') ||
      element.matches('[data-testid="post_message"]') ||
      element.closest('[role="article"][aria-posinset]') ||
      element.closest('[data-pagelet*="FeedUnit"]') ||
      element.closest('[data-testid*="post"]') ||
      element.closest('[role="article"]') ||
      element.closest('div[data-testid="post_container"]') ||
      element.closest('div[data-testid="post_message"]') ||
      element.closest('[data-testid="post_message"]')
    );
  }

  processFeedItems() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    try {
      // Find all feed items
      const feedItems = this.findFeedItems();
      console.log('Facebook Feed Reader: Found', feedItems.length, 'feed items');
      
      // Sort items by aria-posinset to maintain order
      feedItems.sort((a, b) => {
        const posA = parseInt(a.getAttribute('aria-posinset')) || 0;
        const posB = parseInt(b.getAttribute('aria-posinset')) || 0;
        return posA - posB;
      });
      
      feedItems.forEach((item) => {
        if (!item.hasAttribute('data-fb-reader-processed')) {
          this.processFeedItem(item);
        }
      });
    } catch (error) {
      console.error('Facebook Feed Reader: Error processing feed items:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  findFeedItems() {
    // Updated selectors to prioritize aria-posinset and aria-labelledby
    const selectors = [
      // High priority: Items with aria-posinset (most reliable)
      '[role="article"][aria-posinset]',
      // Medium priority: Traditional Facebook selectors
      '[data-pagelet*="FeedUnit"]',
      '[data-testid*="post"]',
      '[role="article"]',
      'div[data-testid="post_container"]',
      'div[data-testid="post_message"]',
      '[data-testid="post_message"]',
      // Additional selectors for different Facebook layouts
      'div[data-testid="post"]',
      'div[data-testid="story"]',
      'div[data-testid="feed_story"]',
      'div[data-testid="feed_story_container"]',
      // More generic selectors
      'div[role="article"]',
      'div[data-testid*="story"]',
      'div[data-testid*="feed"]'
    ];

    let items = [];
    selectors.forEach(selector => {
      try {
        const found = document.querySelectorAll(selector);
        items = items.concat(Array.from(found));
      } catch (e) {
        console.log('Facebook Feed Reader: Selector failed:', selector, e);
      }
    });

    // Remove duplicates and filter out items that are already processed
    const uniqueItems = [...new Set(items)].filter(item => 
      !item.hasAttribute('data-fb-reader-processed') &&
      !this.isLoadingItem(item) // Skip loading items
    );

    console.log('Facebook Feed Reader: Unique unprocessed items:', uniqueItems.length);
    return uniqueItems;
  }

  isLoadingItem(item) {
    // Check if item is in loading state
    return item.querySelector('[aria-label="Loading..."]') !== null ||
           item.getAttribute('aria-label') === 'Loading...' ||
           item.querySelector('[data-visualcompletion="loading-state"]') !== null;
  }

  processFeedItem(item) {
    try {
      // Mark as processed to avoid duplicate processing
      item.setAttribute('data-fb-reader-processed', 'true');
      
      // Generate a unique ID for this feed item
      const itemId = this.generateItemId(item);
      
      // Check if this item was previously checked - but only if it's a valid, specific ID
      if (this.checkedItems.has(itemId) && this.isValidItemId(itemId)) {
        console.log('Facebook Feed Reader: Hiding previously checked item:', itemId);
        this.hideFeedItem(item);
        return;
      }
      
      // Add checkmark to the item
      console.log('Facebook Feed Reader: Adding checkmark to item:', itemId);
      this.addCheckmark(item, itemId);
    } catch (error) {
      console.error('Facebook Feed Reader: Error processing feed item:', error);
    }
  }

  isValidItemId(itemId) {
    // Only consider specific, unique IDs as valid for hiding
    // Avoid generic IDs that might match multiple items
    return itemId && 
           !itemId.startsWith('item_') && // Avoid fallback IDs
           !itemId.startsWith('FeedUnit_') && // Avoid generic FeedUnit IDs
           !itemId.includes('{') && // Avoid IDs with placeholders
           !itemId.includes('}') && // Avoid IDs with placeholders
           itemId.length > 5 && // Allow shorter IDs for aria-labelledby
           !itemId.includes('undefined') && // Avoid IDs with undefined values
           (itemId.startsWith('http') || 
            itemId.includes('pfbid') || 
            itemId.includes('permalink') ||
            itemId.startsWith('_r_') || // aria-labelledby format
            itemId.match(/^\d+$/)); // aria-posinset numeric format
  }

  generateItemId(item) {
    // Try to find a unique identifier for the feed item
    const possibleIds = [
      // Primary: aria-labelledby (most reliable unique identifier)
      item.getAttribute('aria-labelledby'),
      // Secondary: aria-posinset + aria-describedby combination
      this.generateAriaCombinationId(item),
      // Tertiary: Traditional Facebook IDs
      item.getAttribute('data-testid'),
      item.getAttribute('data-pagelet'),
      item.getAttribute('data-ft'),
      item.querySelector('[data-testid="post_message"]')?.textContent?.substring(0, 50),
      item.querySelector('a[href*="/posts/"]')?.href,
      item.querySelector('a[href*="/permalink/"]')?.href,
      item.querySelector('a[href*="/story.php"]')?.href
    ].filter(Boolean);

    if (possibleIds.length > 0) {
      return possibleIds[0];
    }

    // Fallback: use the item's position and some content
    const content = item.textContent?.substring(0, 100) || '';
    const position = Array.from(item.parentElement?.children || []).indexOf(item);
    return `item_${position}_${content.length}`;
  }

  generateAriaCombinationId(item) {
    // Create a unique ID from aria-posinset and aria-describedby
    const posinset = item.getAttribute('aria-posinset');
    const describedby = item.getAttribute('aria-describedby');
    
    if (posinset && describedby) {
      return `pos_${posinset}_desc_${describedby.split(' ')[0]}`; // Use first describedby ID
    } else if (posinset) {
      return `pos_${posinset}`;
    }
    
    return null;
  }

  addCheckmark(item, itemId) {
    try {
      // Create checkmark element
      const checkmark = document.createElement('div');
      checkmark.className = 'fb-reader-checkmark';
      checkmark.innerHTML = '✓';
      checkmark.title = 'Mark as read';
      
      // Position the checkmark
      this.positionCheckmark(checkmark, item);
      
      // Add click event
      checkmark.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleCheckmarkClick(item, itemId);
      });
      
      // Add to the feed item using a more React-friendly approach
      if (item && item.appendChild) {
        item.appendChild(checkmark);
        console.log('Facebook Feed Reader: Checkmark added to item:', itemId);
      }
    } catch (error) {
      console.error('Facebook Feed Reader: Error adding checkmark:', error);
    }
  }

  positionCheckmark(checkmark, item) {
    try {
      // Position the checkmark in the top-right corner of the feed item
      checkmark.style.position = 'absolute';
      checkmark.style.top = '10px';
      checkmark.style.right = '10px';
      checkmark.style.zIndex = '9999';
      
      // Ensure the feed item has relative positioning without interfering with React
      const currentPosition = getComputedStyle(item).position;
      if (currentPosition === 'static') {
        // Use a more subtle approach to avoid React conflicts
        item.style.setProperty('position', 'relative', 'important');
      }
    } catch (error) {
      console.error('Facebook Feed Reader: Error positioning checkmark:', error);
    }
  }

  async handleCheckmarkClick(item, itemId) {
    try {
      console.log('Facebook Feed Reader: Checkmark clicked for item:', itemId);
      
      // Only save valid IDs
      if (this.isValidItemId(itemId)) {
        // Add to checked items
        this.checkedItems.add(itemId);
        
        // Save to storage
        await this.saveCheckedItems();
      }
      
      // Hide the feed item
      this.hideFeedItem(item);
    } catch (error) {
      console.error('Facebook Feed Reader: Error handling checkmark click:', error);
    }
  }

  hideFeedItem(item) {
    try {
      // Add a fade-out animation and then hide
      item.style.transition = 'opacity 0.3s ease-out';
      item.style.opacity = '0';
      
      setTimeout(() => {
        if (item && item.style) {
          item.style.display = 'none';
        }
      }, 300);
    } catch (error) {
      console.error('Facebook Feed Reader: Error hiding feed item:', error);
    }
  }

  async refresh() {
    try {
      // Reload checked items and reprocess all feed items
      await this.loadCheckedItems();
      
      // Remove all existing checkmarks
      document.querySelectorAll('.fb-reader-checkmark').forEach(checkmark => {
        if (checkmark && checkmark.remove) {
          checkmark.remove();
        }
      });
      
      // Remove processed attributes
      document.querySelectorAll('[data-fb-reader-processed]').forEach(item => {
        if (item && item.removeAttribute) {
          item.removeAttribute('data-fb-reader-processed');
        }
      });
      
      // Reprocess all feed items
      this.processFeedItems();
    } catch (error) {
      console.error('Facebook Feed Reader: Error refreshing:', error);
    }
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.processTimeout) {
      clearTimeout(this.processTimeout);
    }
  }
}

// Initialize the feed reader when the page is ready
let feedReader = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Facebook Feed Reader: DOM loaded, initializing...');
    feedReader = new FacebookFeedReader();
  });
} else {
  console.log('Facebook Feed Reader: DOM already loaded, initializing...');
  feedReader = new FacebookFeedReader();
}

// Handle page navigation (Facebook is a SPA)
let currentUrl = location.href;
const urlObserver = new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    console.log('Facebook Feed Reader: URL changed, reinitializing...');
    // Reinitialize for new pages
    setTimeout(() => {
      if (feedReader) {
        feedReader.stop();
      }
      feedReader = new FacebookFeedReader();
    }, 1000);
  }
});

urlObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refresh' && feedReader) {
    feedReader.refresh();
    sendResponse({ success: true });
  }
});

console.log('Facebook Feed Reader: Content script loaded'); 