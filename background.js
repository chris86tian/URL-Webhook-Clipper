/**
 * Background Service Worker - Version 2.0.6
 * FIX: Context menu duplicate ID errors
 * - Added removeAll() before menu creation
 * - Added initialization guard
 * - Added error handling
 */

let destinations = [];
let webhookConfigs = [];
let isRebuildingMenu = false; // ← Guard flag

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

// ✅ FIX: Rebuild context menu with proper cleanup
async function rebuildContextMenu() {
  // ✅ Guard: Prevent concurrent rebuilds
  if (isRebuildingMenu) {
    console.log('⏸️ [BACKGROUND] Menu rebuild already in progress, skipping');
    return;
  }
  
  isRebuildingMenu = true;
  
  try {
    // ✅ CRITICAL: Remove ALL existing menu items first
    await chrome.contextMenus.removeAll();
    console.log('🗑️ [BACKGROUND] Removed all existing context menu items');
    
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
    
  } catch (error) {
    console.error('❌ [BACKGROUND] Error rebuilding context menu:', error);
  } finally {
    // ✅ Release guard
    isRebuildingMenu = false;
  }
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
    
    // Prepare payload
    const payload = {
      url: info.linkUrl || info.srcUrl || tab.url,
      title: tab.title,
      notes: info.selectionText || '',
      timestamp: new Date().toISOString(),
      contextType: info.contexts?.[0] || 'page'
    };
    
    // Try to get meta description
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.querySelector('meta[name="description"]')?.content || ''
      });
      payload.metaDescription = results?.[0]?.result || '';
    } catch (error) {
      console.warn('⚠️ [BACKGROUND] Could not get meta description:', error.message);
    }
    
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
  const webhook = webhookConfigs.find(w => w.id === destination.webhookId);
  
  if (!webhook?.url) {
    throw new Error('Webhook configuration not found');
  }
  
  const webhookPayload = {
    url: payload.url,
    title: payload.title,
    notes: payload.notes,
    template: destination.templateName || '',
    metaDescription: payload.metaDescription || '',
    timestamp: formatTimestamp(new Date()),
    attachments: []
  };
  
  console.log('📤 [BACKGROUND] Webhook payload:', webhookPayload);
  
  const response = await fetch(webhook.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookPayload)
  });
  
  if (!response.ok) {
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

// ✅ FIX: Debounced storage change handler
let storageChangeTimeout = null;

chrome.storage.sync.onChanged.addListener((changes) => {
  if (changes.webhookConfigs) {
    console.log('🔄 [BACKGROUND] Webhooks changed, scheduling reload');
    
    // ✅ Debounce: Wait 500ms before reloading
    clearTimeout(storageChangeTimeout);
    storageChangeTimeout = setTimeout(() => {
      loadDestinations();
    }, 500);
  }
});

chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.airtableConfigs) {
    console.log('🔄 [BACKGROUND] Airtable configs changed, scheduling reload');
    
    // ✅ Debounce: Wait 500ms before reloading
    clearTimeout(storageChangeTimeout);
    storageChangeTimeout = setTimeout(() => {
      loadDestinations();
    }, 500);
  }
});

console.log('✅ [BACKGROUND v2.0.6] Service worker initialized with duplicate fix');
