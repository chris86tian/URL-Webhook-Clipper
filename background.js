// Background service worker for URL Webhook Clipper
// Handles context menu and other background tasks

chrome.runtime.onInstalled.addListener(() => {
  console.log('URL Webhook Clipper installed');
  
  // Create context menu item
  chrome.contextMenus.create({
    id: 'clipToWebhook',
    title: 'Clip to Webhook',
    contexts: ['page', 'selection', 'link']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'clipToWebhook') {
    // Open popup when context menu is clicked
    chrome.action.openPopup();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabInfo') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        sendResponse({
          url: tabs[0].url,
          title: tabs[0].title
        });
      }
    });
    return true; // Keep message channel open for async response
  }
});
