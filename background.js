// Create the parent context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'sendToWebhook',
    title: 'Send to Webhook',
    contexts: ['selection']
  });

  // Load webhooks and create submenu items
  updateContextMenu();
});

// Update context menu when storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.webhookConfigs) {
    updateContextMenu();
  }
});

function updateContextMenu() {
  // Remove existing items
  chrome.contextMenus.removeAll(() => {
    // Recreate parent menu
    chrome.contextMenus.create({
      id: 'sendToWebhook',
      title: 'Send to Webhook',
      contexts: ['selection']
    });

    // Get webhooks from storage
    chrome.storage.sync.get(['webhookConfigs'], function(result) {
      const configs = result.webhookConfigs || [];
      
      configs.forEach(webhook => {
        // Create submenu for each webhook
        chrome.contextMenus.create({
          id: `webhook-${webhook.id}`,
          parentId: 'sendToWebhook',
          title: webhook.label,
          contexts: ['selection']
        });

        // Create template items for each webhook
        webhook.templates.forEach(template => {
          chrome.contextMenus.create({
            id: `${webhook.id}-${template}`,
            parentId: `webhook-${webhook.id}`,
            title: template,
            contexts: ['selection']
          });
        });
      });
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.includes('-')) {
    const [webhookId, template] = info.menuItemId.split('-');
    const selectedText = info.selectionText;

    chrome.storage.sync.get(['webhookConfigs'], function(result) {
      const configs = result.webhookConfigs || [];
      const webhook = configs.find(w => w.id === webhookId.replace('webhook-', ''));

      if (webhook) {
        const payload = {
          url: tab.url,
          title: tab.title,
          notes: selectedText, // Set selected text as notes
          template: template,
          metaDescription: '', // You may want to fetch this if needed
          timestamp: new Date().toISOString(),
          attachments: [] // Set attachments if needed
        };

        fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          // Show notification on success
          if (chrome.notifications) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon48.png',
              title: 'Success',
              message: 'Text sent to webhook successfully!'
            });
          } else {
            console.error('Notifications API is not available.');
          }
        })
        .catch(error => {
          // Show notification on error
          if (chrome.notifications) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon48.png',
              title: 'Error',
              message: 'Failed to send text to webhook: ' + error.message
            });
          } else {
            console.error('Notifications API is not available.');
          }
        });
      }
    });
  }
});
