/**
 * Background Service Worker - Version 2.0.6
 * Handles context menu and storage monitoring
 * FEATURE: Context menu sends same data as popup (selected text, meta description)
 */

let destinations = [];
let webhookConfigs = [];

// Load destinations on startup
chrome.runtime.onStartup.addListener(loadDestinations);
chrome.runtime.onInstalled.addListener(async () => {
  await loadDestinations();
  console.log('✅ [BACKGROUND v2.0.6] Extension installed, context menu created');
});

// Load destinations from storage
async function loadDestinations() {
  try {
    // Load webhooks from sync storage
    const syncData = await chrome.storage.sync.get(['webhookConfigs']);
    webhookConfigs = syncData.webhookConfigs || [];
    
    // Load Airtable configs from local storage
    const localData = await chrome.storage.local.get(['airtableConfigs']);
    const airtableBases = localData.airtableConfigs || [];
    
    // Build webhook destinations (with templates)
    const webhookDestinations = [];
    webhookConfigs.forEach(webhook => {
      if (webhook.templates && webhook.templates.length > 0) {
        // Add each template as a separate destination
        webhook.templates.forEach(template => {
          webhookDestinations.push({
            id: `${webhook.id}|${template.name}`,
            name: `${webhook.name} - ${template.name}`,
            type: 'webhook',
            webhookId: webhook.id,
            templateName: template.name
          });
        });
      } else {
        // No templates - add webhook directly
        webhookDestinations.push({
          id: webhook.id,
          name: webhook.name,
          type: 'webhook',
          webhookId: webhook.id,
          templateName: null
        });
      }
    });
    
    // Flatten Airtable tables into destinations
    const airtableDestinations = [];
    airtableBases.forEach(base => {
      if (base.config?.tables) {
        base.config.tables.forEach(table => {
          airtableDestinations.push({
            id: `${base.id}|${table.id}`,
            name: `${base.config.name} - ${table.name}`,
            type: 'airtable',
            baseId: base.id,
            tableId: table.id
          });
        });
      }
    });
    
    // Combine all destinations
    destinations = [
      ...webhookDestinations,
      ...airtableDestinations
    ];
    
    console.log('📋 [BACKGROUND] Loaded destinations:', {
      total: destinations.length,
      webhooks: webhookDestinations.length,
      airtable: airtableDestinations.length
    });
    
    // Rebuild context menu
    await rebuildContextMenu();
    
  } catch (error) {
    console.error('❌ [BACKGROUND] Error loading destinations:', error);
  }
}

// Rebuild context menu with current destinations
async function rebuildContextMenu() {
  // Remove all existing menu items
  await chrome.contextMenus.removeAll();
  
  if (destinations.length === 0) {
    // No destinations - show "Configure" option
    chrome.contextMenus.create({
      id: 'configure',
      title: 'Configure Destinations',
      contexts: ['page', 'selection', 'link', 'image']
    });
    console.log('📋 [BACKGROUND] No destinations - showing configure option');
    return;
  }
  
  // Create parent menu
  chrome.contextMenus.create({
    id: 'sendToDestination',
    title: 'Send to Webhook/Airtable',
    contexts: ['page', 'selection', 'link', 'image']
  });
  
  // Group destinations by type
  const webhooks = destinations.filter(d => d.type === 'webhook');
  const airtables = destinations.filter(d => d.type === 'airtable');
  
  // Add webhook destinations
  if (webhooks.length > 0) {
    // Header
    chrome.contextMenus.create({
      id: 'webhook-header',
      title: '🔗 Webhooks',
      contexts: ['page', 'selection', 'link', 'image'],
      parentId: 'sendToDestination',
      enabled: false
    });
    
    // Individual webhook items (with templates)
    webhooks.forEach(dest => {
      chrome.contextMenus.create({
        id: `send-${dest.id}`,
        title: dest.name,
        contexts: ['page', 'selection', 'link', 'image'],
        parentId: 'sendToDestination'
      });
    });
  }
  
  // Add separator if both types exist
  if (webhooks.length > 0 && airtables.length > 0) {
    chrome.contextMenus.create({
      id: 'separator',
      type: 'separator',
      contexts: ['page', 'selection', 'link', 'image'],
      parentId: 'sendToDestination'
    });
  }
  
  // Add Airtable destinations
  if (airtables.length > 0) {
    // Header
    chrome.contextMenus.create({
      id: 'airtable-header',
      title: '📊 Airtable',
      contexts: ['page', 'selection', 'link', 'image'],
      parentId: 'sendToDestination',
      enabled: false
    });
    
    // Individual Airtable items
    airtables.forEach(dest => {
      chrome.contextMenus.create({
        id: `send-${dest.id}`,
        title: dest.name,
        contexts: ['page', 'selection', 'link', 'image'],
        parentId: 'sendToDestination'
      });
    });
  }
  
  console.log('✅ [BACKGROUND] Context menu rebuilt with', destinations.length, 'destinations');
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'configure') {
    // Open popup to configure
    chrome.action.openPopup();
    return;
  }
  
  if (info.menuItemId.startsWith('send-')) {
    const destinationId = info.menuItemId.replace('send-', '');
    const destination = destinations.find(d => d.id === destinationId);
    
    if (!destination) {
      console.error('❌ [BACKGROUND] Destination not found:', destinationId);
      return;
    }
    
    console.log('📤 [BACKGROUND] Sending to:', destination.name);
    
    // ✅ Extract page content (same as popup)
    let pageUrl = tab.url;
    let pageTitle = tab.title;
    let selectedText = info.selectionText || '';
    let metaDescription = '';
    
    // Try to get meta description from page
    const isRestrictedUrl = tab.url.startsWith('chrome://') || 
                           tab.url.startsWith('edge://') || 
                           tab.url.startsWith('about:');
    
    if (!isRestrictedUrl) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            return {
              metaDescription: document.querySelector('meta[name="description"]')?.content || '',
              pageUrl: window.location.href,
              pageTitle: document.title
            };
          }
        });
        
        if (results?.[0]?.result) {
          metaDescription = results[0].result.metaDescription;
          // Use extracted URL/title if available (more accurate than tab API)
          pageUrl = results[0].result.pageUrl || pageUrl;
          pageTitle = results[0].result.pageTitle || pageTitle;
        }
        
        console.log('✅ [BACKGROUND] Page content extracted:', {
          url: pageUrl,
          title: pageTitle,
          metaDescription: metaDescription ? 'Found' : 'Not found',
          selectedText: selectedText ? `${selectedText.length} chars` : 'None'
        });
        
      } catch (error) {
        console.warn('⚠️ [BACKGROUND] Could not extract page content:', error.message);
      }
    } else {
      console.log('⚠️ [BACKGROUND] Restricted URL, using tab API data only');
    }
    
    // ✅ Build payload (SAME structure as popup)
    const payload = {
      url: pageUrl,
      title: pageTitle,
      notes: selectedText,
      metaDescription: metaDescription,
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 [BACKGROUND] Payload prepared:', {
      url: payload.url,
      title: payload.title,
      notesLength: payload.notes.length,
      hasMetaDescription: !!payload.metaDescription
    });
    
    // Send to destination
    try {
      if (destination.type === 'webhook') {
        await sendToWebhook(destination, payload);
      } else if (destination.type === 'airtable') {
        await sendToAirtable(destination, payload);
      }
      
      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Sent Successfully',
        message: `Sent to ${destination.name}`
      });
      
    } catch (error) {
      console.error('❌ [BACKGROUND] Send error:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Send Failed',
        message: error.message
      });
    }
  }
});

// Format timestamp in German locale
function formatTimestamp(date) {
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('de-DE', options);
}

// Send to webhook
async function sendToWebhook(destination, payload) {
  // Use webhookId from destination structure
  const webhook = webhookConfigs.find(w => w.id === destination.webhookId);
  
  if (!webhook?.url) {
    throw new Error('Webhook configuration not found');
  }
  
  // ✅ Build payload with SAME structure as popup
  const webhookPayload = {
    url: payload.url,
    title: payload.title,
    notes: payload.notes,
    template: destination.templateName || '',
    metaDescription: payload.metaDescription || '',
    timestamp: formatTimestamp(new Date()),
    attachments: []  // Context menu has no file attachments
  };
  
  console.log('📤 [BACKGROUND] Webhook payload:', webhookPayload);
  
  const response = await fetch(webhook.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookPayload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [BACKGROUND] Webhook error response:', errorText);
    throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
  }
  
  console.log('✅ [BACKGROUND] Webhook sent successfully');
}

// Send to Airtable
async function sendToAirtable(destination, payload) {
  const localData = await chrome.storage.local.get(['airtableConfigs']);
  const airtableBases = localData.airtableConfigs || [];
  const base = airtableBases.find(b => b.id === destination.baseId);
  
  if (!base?.config) {
    throw new Error('Airtable base configuration not found');
  }
  
  const tableConfig = base.config.configuredTables?.[destination.tableId];
  if (!tableConfig?.fieldMappings) {
    throw new Error('Table field mappings not configured');
  }
  
  // Build Airtable record
  const fields = {};
  
  if (tableConfig.fieldMappings.url) {
    fields[tableConfig.fieldMappings.url] = payload.url;
  }
  
  if (tableConfig.fieldMappings.title) {
    fields[tableConfig.fieldMappings.title] = payload.title;
  }
  
  if (tableConfig.fieldMappings.notes && payload.notes) {
    fields[tableConfig.fieldMappings.notes] = payload.notes;
  }
  
  // Send to Airtable API
  const response = await fetch(
    `https://api.airtable.com/v0/${base.config.baseId}/${destination.tableId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${base.config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Airtable failed: ${error.error?.message || response.statusText}`);
  }
  
  console.log('✅ [BACKGROUND] Airtable record created');
}

// Listen for storage changes to update context menu
chrome.storage.sync.onChanged.addListener((changes) => {
  if (changes.webhookConfigs) {
    console.log('🔄 [BACKGROUND] Webhooks changed, reloading destinations');
    loadDestinations();
  }
});

chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.airtableConfigs) {
    console.log('🔄 [BACKGROUND] Airtable configs changed, reloading destinations');
    loadDestinations();
  }
});

console.log('✅ [BACKGROUND v2.0.6] Service worker initialized - context menu sends same data as popup');
