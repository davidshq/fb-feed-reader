// Popup script for Facebook Feed Reader
document.addEventListener('DOMContentLoaded', function() {
    const checkedCountElement = document.getElementById('checkedCount');
    const clearButton = document.getElementById('clearButton');
    const refreshButton = document.getElementById('refreshButton');
    const showIndividualsCheckbox = document.getElementById('showIndividuals');
    const showGroupsCheckbox = document.getElementById('showGroups');
    const showSponsoredCheckbox = document.getElementById('showSponsored');
    const filterStatusElement = document.getElementById('filterStatus');
    
    // Debug section elements
    const debugSection = document.getElementById('debugSection');
    const debugHeader = document.getElementById('debugHeader');
    const hideShortcutsCheckbox = document.getElementById('hideShortcuts');
    const hideBannerCheckbox = document.getElementById('hideBanner');
    const hideComplementaryCheckbox = document.getElementById('hideComplementary');
    const hideStoriesCheckbox = document.getElementById('hideStories');
    const hideCreateCheckbox = document.getElementById('hideCreate');

    // Load the count and filter settings when popup opens
    loadCheckedCount();
    loadFilterSettings();
    loadDebugSettings();

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
        loadFilterSettings();
        loadDebugSettings();
    });

    // Debug section header click for collapsible behavior
    debugHeader.addEventListener('click', function() {
        debugSection.classList.toggle('collapsed');
    });

    // Debug checkbox events
    hideShortcutsCheckbox.addEventListener('change', function() {
        updateDebugSettings();
    });

    hideBannerCheckbox.addEventListener('change', function() {
        updateDebugSettings();
    });

    hideComplementaryCheckbox.addEventListener('change', function() {
        updateDebugSettings();
    });

    hideStoriesCheckbox.addEventListener('change', function() {
        updateDebugSettings();
    });

    hideCreateCheckbox.addEventListener('change', function() {
        updateDebugSettings();
    });

    // Filter checkbox events
    showIndividualsCheckbox.addEventListener('change', function() {
        updateFilters();
    });

    showGroupsCheckbox.addEventListener('change', function() {
        updateFilters();
    });

    showSponsoredCheckbox.addEventListener('change', function() {
        updateFilters();
    });

    function loadCheckedCount() {
        chrome.storage.local.get(['checkedItems'], function(result) {
            const count = result.checkedItems ? result.checkedItems.length : 0;
            checkedCountElement.textContent = count.toString();
        });
    }

    function loadFilterSettings() {
        // Load filter settings from storage instead of content script
        chrome.storage.local.get(['filterSettings'], function(result) {
            const defaultSettings = { showIndividuals: true, showGroups: true, showSponsored: true };
            const settings = result.filterSettings || defaultSettings;
            
            showIndividualsCheckbox.checked = settings.showIndividuals;
            showGroupsCheckbox.checked = settings.showGroups;
            showSponsoredCheckbox.checked = settings.showSponsored;
            
            updateFilterStatus(settings);
        });
    }

    function updateFilterStatus(settings) {
        const status = `Individuals: ${settings.showIndividuals ? 'ON' : 'OFF'} | Groups: ${settings.showGroups ? 'ON' : 'OFF'} | Sponsored: ${settings.showSponsored ? 'ON' : 'OFF'}`;
        filterStatusElement.textContent = status;
    }

    function updateFilters() {
        const filters = {
            showIndividuals: showIndividualsCheckbox.checked,
            showGroups: showGroupsCheckbox.checked,
            showSponsored: showSponsoredCheckbox.checked
        };

        updateFilterStatus(filters);

        // Save to storage first
        chrome.storage.local.set({ filterSettings: filters }, function() {
            console.log('Filter settings saved:', filters);
            filterStatusElement.textContent += ' (Saved)';
            
            // Then notify content script to update
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0] && tabs[0].url && tabs[0].url.includes('facebook.com')) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'updateFilters',
                        filters: filters
                    }, function(response) {
                        if (chrome.runtime.lastError) {
                            console.log('Content script not ready, settings saved for next load');
                            filterStatusElement.textContent += ' (Content script not ready)';
                        } else {
                            console.log('Filters updated in content script');
                            filterStatusElement.textContent += ' (Applied)';
                        }
                    });
                } else {
                    filterStatusElement.textContent += ' (Not on Facebook)';
                }
            });
        });
    }

    function loadDebugSettings() {
        chrome.storage.local.get(['debugSettings'], function(result) {
            const defaultSettings = { hideShortcuts: false, hideBanner: false, hideComplementary: false, hideStories: false, hideCreate: false };
            const settings = result.debugSettings || defaultSettings;
            
            hideShortcutsCheckbox.checked = settings.hideShortcuts;
            hideBannerCheckbox.checked = settings.hideBanner;
            hideComplementaryCheckbox.checked = settings.hideComplementary;
            hideStoriesCheckbox.checked = settings.hideStories;
            hideCreateCheckbox.checked = settings.hideCreate;
        });
    }

    function updateDebugSettings() {
        const debugSettings = {
            hideShortcuts: hideShortcutsCheckbox.checked,
            hideBanner: hideBannerCheckbox.checked,
            hideComplementary: hideComplementaryCheckbox.checked,
            hideStories: hideStoriesCheckbox.checked,
            hideCreate: hideCreateCheckbox.checked
        };

        // Save to storage
        chrome.storage.local.set({ debugSettings: debugSettings }, function() {
            console.log('Debug settings saved:', debugSettings);
            
            // Notify content script to update UI elements
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0] && tabs[0].url && tabs[0].url.includes('facebook.com')) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'updateDebugSettings',
                        debugSettings: debugSettings
                    }, function(response) {
                        if (chrome.runtime.lastError) {
                            console.log('Content script not ready, debug settings saved for next load');
                        } else {
                            console.log('Debug settings applied in content script');
                        }
                    });
                }
            });
        });
    }
}); 