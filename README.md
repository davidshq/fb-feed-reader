# Facebook Feed Reader Chrome Extension

A Chrome browser extension that adds checkmarks to Facebook feed items and hides them when checked. Once an item has been checked, it disappears from the feed and won't show up again when you reload the page.

## Features

- ✅ Adds checkmarks to each Facebook feed item
- ✅ Click checkmarks to mark items as read and hide them
- ✅ Persists checked items across browser sessions
- ✅ Automatically hides previously checked items when reloading the page
- ✅ Works with Facebook's dynamic content loading
- ✅ Responsive design with mobile support
- ✅ Dark mode support

## Installation

### Method 1: Load as Unpacked Extension (Recommended for Development)

1. **Download or clone this repository** to your local machine

2. **Generate the extension icons:**
   - Open `create_icons.html` in your browser
   - Click the download buttons to save `icon16.png`, `icon48.png`, and `icon128.png` to the extension directory

3. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the extension directory
   - The extension should now appear in your extensions list

4. **Navigate to Facebook:**
   - Go to `https://www.facebook.com`
   - You should see checkmarks appear on feed items

### Method 2: Install from Chrome Web Store (Future)

Once published, you'll be able to install directly from the Chrome Web Store.

## Usage

1. **Navigate to Facebook:** Go to `https://www.facebook.com` and scroll to your feed

2. **See checkmarks:** Blue checkmark buttons (✓) will appear in the top-right corner of each feed item

3. **Mark as read:** Click any checkmark to mark that item as read. The item will fade out and disappear

4. **Persistent hiding:** When you reload the page or navigate away and back, previously checked items will remain hidden

5. **New content:** As you scroll and new feed items load, they will automatically get checkmarks

## How It Works

The extension uses several techniques to work with Facebook's dynamic content:

- **Mutation Observer:** Watches for new feed items being added to the page
- **Multiple Selectors:** Uses various CSS selectors to identify feed items (Facebook's structure can vary)
- **Unique Identification:** Generates unique IDs for each feed item to track what's been checked
- **Chrome Storage:** Saves checked items to browser storage for persistence
- **SPA Navigation:** Handles Facebook's single-page application navigation

## File Structure

```
fb-feed-reader/
├── manifest.json          # Extension configuration
├── content.js            # Main content script
├── background.js         # Background service worker
├── styles.css            # CSS styles for checkmarks
├── create_icons.html     # Icon generator (optional)
├── icon16.png           # Extension icon (16x16)
├── icon48.png           # Extension icon (48x48)
├── icon128.png          # Extension icon (128x128)
└── README.md            # This file
```

## Technical Details

### Permissions Used

- `storage`: To save checked items persistently
- `activeTab`: To interact with the current Facebook tab
- `host_permissions`: To run on Facebook domains

### Content Script Features

- **Feed Item Detection:** Uses multiple selectors to find Facebook feed items
- **Dynamic Content:** Observes DOM changes to handle new content
- **Unique IDs:** Generates stable identifiers for feed items
- **Visual Feedback:** Smooth animations for hiding items
- **Error Handling:** Graceful handling of Facebook's changing structure

### Storage

Checked items are stored in Chrome's local storage as an array of unique identifiers. This allows the extension to:

- Remember checked items across browser sessions
- Hide previously checked items when the page is reloaded
- Work independently for each user profile

## Troubleshooting

### Checkmarks not appearing?

1. **Refresh the page:** Sometimes Facebook's content takes time to load
2. **Check console:** Open Developer Tools (F12) and look for any error messages
3. **Verify permissions:** Make sure the extension has permission to run on Facebook
4. **Update extension:** Try reloading the extension in `chrome://extensions/`

### Items not staying hidden?

1. **Check storage:** The extension uses Chrome's local storage
2. **Clear cache:** Try clearing browser cache and cookies
3. **Reinstall:** Remove and reinstall the extension

### Performance issues?

1. **Disable on other sites:** The extension only needs to run on Facebook
2. **Check for conflicts:** Other extensions might interfere
3. **Update Chrome:** Ensure you're using a recent version of Chrome

## Development

### Making Changes

1. **Edit files:** Modify `content.js`, `styles.css`, or other files as needed
2. **Reload extension:** Go to `chrome://extensions/` and click the reload button
3. **Refresh Facebook:** Reload the Facebook page to see changes

### Debugging

1. **Console logs:** Check the browser console for debug information
2. **Content script:** Use `console.log()` in `content.js` for debugging
3. **Storage inspection:** Check Chrome DevTools > Application > Storage for saved data

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension.

## License

This project is open source and available under the MIT License.

## Privacy

This extension:
- Only runs on Facebook domains
- Stores data locally in your browser
- Does not send any data to external servers
- Does not track your browsing activity outside of Facebook 