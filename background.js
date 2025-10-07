// Background service worker for URL Webhook Clipper
// Handles context menu and other background tasks

let webhookConfigs = [];
let contextMenusCreated = false;

// Load webhook configurations on startup
async function loadWebhookConfigs() {
  try {
    const result = await chrome.storage.sync.get(['webhookConfigs']);
    webhookConfigs = result.webhookConfigs || [];
    console.log('🔍 Loaded webhook configs:', webhookConfigs.length);
    
    // 🆕 DEBUG: Log actual webhook IDs
    webhookConfigs.forEach((webhook, index) => {
      console.log(`  Webhook ${index}:`, {
        id: webhook.id,
        label: webhook.label,
        url: webhook.url ? webhook.url.substring(0, 50) + '...' : 'NO URL',
        templates: webhook.templates?.length || 0
      });
    });
    
    await updateContextMenu();
  } catch (error) {
    console.error('Error loading webhook configs:', error);
  }
}

// Update context menu with current webhooks and templates
async function updateContextMenu() {
  try {
    // Remove all existing context menus
    await chrome.contextMenus.removeAll();
    contextMenusCreated = false;
    console.log('Cleared all context menus');

    if (webhookConfigs.length === 0) {
      // Create a single disabled menu item if no webhooks configured
      await chrome.contextMenus.create({
        id: 'no-webhooks',
        title: 'No webhooks configured',
        contexts: ['page', 'selection', 'link'],
        enabled: false
      });
      console.log('Created "no webhooks" menu item');
      contextMenusCreated = true;
      return;
    }

    // Create parent menu
    await chrome.contextMenus.create({
      id: 'clip-to-webhook-parent',
      title: 'Clip to Webhook',
      contexts: ['page', 'selection', 'link']
    });
    console.log('Created parent menu');

    // Create submenu for each webhook
    for (let webhookIndex = 0; webhookIndex < webhookConfigs.length; webhookIndex++) {
      const webhook = webhookConfigs[webhookIndex];
      
      // 🆕 FIX: Use webhook.id directly as menu ID (with index as fallback)
      const menuId = `webhook-${webhookIndex}`;
      
      console.log(`🔧 Creating menu for webhook:`, {
        originalId: webhook.id,
        menuId: menuId,
        label: webhook.label
      });
      
      // Create webhook submenu
      await chrome.contextMenus.create({
        id: menuId,
        parentId: 'clip-to-webhook-parent',
        title: webhook.label || `Webhook ${webhook.id}`,
        contexts: ['page', 'selection', 'link']
      });
      console.log(`✅ Created webhook menu: ${webhook.label || webhook.id}`);

      // Add templates for this webhook
      if (webhook.templates && webhook.templates.length > 0) {
        for (let templateIndex = 0; templateIndex < webhook.templates.length; templateIndex++) {
          const template = webhook.templates[templateIndex];
          const templateId = `${menuId}-template-${templateIndex}`;
          
          await chrome.contextMenus.create({
            id: templateId,
            parentId: menuId,
            title: template.name,
            contexts: ['page', 'selection', 'link']
          });
          console.log(`  - Created template: ${template.name}`);
        }
      } else {
        // No templates - create a "Send" option
        await chrome.contextMenus.create({
          id: `${menuId}-send`,
          parentId: menuId,
          title: 'Send',
          contexts: ['page', 'selection', 'link']
        });
        console.log(`  - Created "Send" option (no templates)`);
      }
    }

    contextMenusCreated = true;
    console.log('✅ Context menus created successfully');
  } catch (error) {
    console.error('❌ Error creating context menus:', error);
    contextMenusCreated = false;
  }
}

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('🚀 URL Webhook Clipper installed');
  await loadWebhookConfigs();
});

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('🚀 URL Webhook Clipper startup');
  await loadWebhookConfigs();
});

// Listen for storage changes to update context menu
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'sync' && changes.webhookConfigs) {
    console.log('📝 Webhook configs changed, updating context menu');
    await loadWebhookConfigs();
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('🖱️ Context menu clicked:', info.menuItemId);
  console.log('📋 Full info object:', JSON.stringify(info, null, 2));
  console.log('📋 Tab info:', JSON.stringify({ url: tab.url, title: tab.title, id: tab.id }, null, 2));
  
  const menuItemId = info.menuItemId;

  // Ignore if no webhooks or disabled menu
  if (menuItemId === 'no-webhooks') {
    console.log('No webhooks configured - ignoring click');
    return;
  }

  // 🆕 FIX: Parse webhook INDEX instead of ID
  const match = menuItemId.match(/^webhook-(\d+)(?:-template-(\d+)|-send)?$/);
  if (!match) {
    console.error('❌ Invalid menu item ID format:', menuItemId);
    return;
  }

  const webhookIndex = parseInt(match[1]);
  const templateIndex = match[2] !== undefined ? parseInt(match[2]) : null;

  console.log(`🔍 Parsed: Webhook Index: ${webhookIndex}, Template Index: ${templateIndex}`);

  // 🆕 CRITICAL FIX: Reload webhook configs from storage (service worker may have restarted)
  console.log('🔄 Reloading webhook configs from storage...');
  const result = await chrome.storage.sync.get(['webhookConfigs']);
  const freshWebhookConfigs = result.webhookConfigs || [];
  
  console.log(`📊 Fresh configs loaded: ${freshWebhookConfigs.length} webhooks`);
  freshWebhookConfigs.forEach((w, i) => {
    console.log(`  [${i}]:`, {
      id: w.id,
      label: w.label,
      hasUrl: !!w.url,
      templates: w.templates?.length || 0
    });
  });

  // 🆕 FIX: Get webhook by INDEX from FRESH configs
  const webhook = freshWebhookConfigs[webhookIndex];
  
  if (!webhook || !webhook.url) {
    console.error('❌ Webhook not found at index:', webhookIndex);
    console.error('📊 Available webhooks:', freshWebhookConfigs.map((w, i) => ({ 
      index: i, 
      id: w.id, 
      label: w.label, 
      hasUrl: !!w.url 
    })));
    await showNotification('Error', 'Webhook configuration not found', 'error');
    return;
  }

  console.log(`✅ Found webhook at index ${webhookIndex}:`, {
    id: webhook.id,
    label: webhook.label,
    url: webhook.url.substring(0, 50) + '...',
    hasTemplates: webhook.templates?.length > 0
  });

  // Get template if specified
  let templateName = '';
  if (templateIndex !== null && webhook.templates && webhook.templates[templateIndex]) {
    templateName = webhook.templates[templateIndex].name;
    console.log(`✅ Using template: ${templateName}`);
  }

  // Prepare payload
  const payload = {
    url: tab.url,
    title: tab.title,
    notes: info.selectionText || '',
    template: templateName,
    metaDescription: '',
    timestamp: new Date().toISOString(),
    attachments: []
  };

  console.log('📦 Payload prepared:', JSON.stringify(payload, null, 2));

  // Try to get meta description if not a restricted URL
  const isRestrictedUrl = tab.url.startsWith('chrome://') ||
                          tab.url.startsWith('https://chrome.google.com/webstore') ||
                          tab.url.startsWith('edge://') ||
                          tab.url.startsWith('about:');

  if (!isRestrictedUrl && tab.id) {
    try {
      console.log('🔍 Attempting to get meta description...');
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const metaDesc = document.querySelector('meta[name="description"]');
          return metaDesc ? metaDesc.content : '';
        }
      });

      if (injectionResults && injectionResults.length > 0 && injectionResults[0].result) {
        payload.metaDescription = injectionResults[0].result;
        console.log('✅ Meta description retrieved:', payload.metaDescription.substring(0, 100) + '...');
      } else {
        console.log('ℹ️ No meta description found');
      }
    } catch (error) {
      console.warn("⚠️ Could not get meta description:", error.message);
    }
  } else {
    console.log('⏭️ Skipping meta description (restricted URL)');
  }

  // Send to webhook with detailed logging
  try {
    console.log('📤 Sending to webhook...');
    console.log('   URL:', webhook.url);
    console.log('   Method: POST');
    console.log('   Headers:', { 'Content-Type': 'application/json' });
    console.log('   Body:', JSON.stringify(payload, null, 2));
    
    const fetchStartTime = Date.now();
    
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const fetchDuration = Date.now() - fetchStartTime;
    
    console.log(`📥 Response received (${fetchDuration}ms):`);
    console.log('   Status:', response.status, response.statusText);
    console.log('   OK:', response.ok);
    console.log('   Headers:', Object.fromEntries(response.headers.entries()));

    // Try to read response body
    let responseBody = '';
    try {
      responseBody = await response.text();
      console.log('   Body:', responseBody);
    } catch (e) {
      console.warn('   Could not read response body:', e.message);
    }

    if (response.ok) {
      // Show success notification
      await showNotification(
        'Webhook Clipper',
        `Successfully sent to ${webhook.label || 'webhook'}${templateName ? ` (${templateName})` : ''}`,
        'success'
      );
      console.log('✅ Successfully sent to webhook');
    } else {
      throw new Error(`${response.status} ${response.statusText}${responseBody ? ': ' + responseBody : ''}`);
    }
  } catch (error) {
    console.error('❌ Context menu send error:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    
    await showNotification(
      'Webhook Clipper Error',
      `Failed to send: ${error.message}`,
      'error'
    );
  }
});

// Helper function to show notifications
async function showNotification(title, message, type) {
  try {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message,
      priority: type === 'error' ? 2 : 1
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

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
  
  if (request.action === 'getContextMenuStatus') {
    sendResponse({
      created: contextMenusCreated,
      webhookCount: webhookConfigs.length
    });
    return true;
  }
});

// Log service worker lifecycle
console.log('🔧 Background service worker loaded');
