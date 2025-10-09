/**
 * Main Popup Script - KONZEPT A Implementation
 * V17 - WORKAROUND: Load collaborators from existing records
 */

import { storage } from './modules/storage.js';
import { theme } from './modules/theme.js';
import { fileHandler } from './modules/fileHandler.js';
import { sender } from './modules/sender.js';
import { webhookManager } from './modules/webhookManager.js';
import { airtableManager } from './modules/airtableManager.js';

// Global state
let isInitialized = false;
let destinations = []; // Unified list of webhooks + Airtable bases
let currentDestination = null;

// 🔧 FIX: Expose destinations globally for sender.js
window.destinations = destinations;

/**
 * 🔬 DEBUG TOOL: Inspect all storage areas
 */
window.debugStorage = async function() {
  console.log('\n=== 🔬 STORAGE DEBUG INSPECTOR ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const local = await chrome.storage.local.get(null);
    console.log('\n📦 chrome.storage.local:');
    console.log('   Total Keys:', Object.keys(local).length);
    console.log('   Keys:', Object.keys(local));
    console.log('   Full Data:', local);
    
    const sync = await chrome.storage.sync.get(null);
    console.log('\n☁️ chrome.storage.sync:');
    console.log('   Total Keys:', Object.keys(sync).length);
    console.log('   Keys:', Object.keys(sync));
    console.log('   Full Data:', sync);
    
    const session = await chrome.storage.session.get(null);
    console.log('\n⏱️ chrome.storage.session:');
    console.log('   Total Keys:', Object.keys(session).length);
    console.log('   Keys:', Object.keys(session));
    console.log('   Full Data:', session);
    
    console.log('\n=================================\n');
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

/**
 * 🔬 DEBUG TOOL: Clear all storage
 */
window.clearAllStorage = async function() {
  if (!confirm('⚠️ WARNUNG: Alle gespeicherten Daten löschen?')) return;
  
  console.log('🗑️ Clearing all storage...');
  await chrome.storage.local.clear();
  await chrome.storage.sync.clear();
  await chrome.storage.session.clear();
  console.log('✅ All storage cleared');
  
  location.reload();
};

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  if (!statusDiv) return;

  statusDiv.textContent = message;
  statusDiv.classList.remove('success', 'error', 'info');
  statusDiv.classList.add(type);
  statusDiv.style.display = 'block';

  if (type !== 'error') {
    setTimeout(() => {
      if (statusDiv.textContent === message) {
        statusDiv.style.display = 'none';
        statusDiv.textContent = '';
        statusDiv.classList.remove('success', 'error', 'info');
      }
    }, 5000);
  }
}

/**
 * 🎯 KONZEPT A: Load and merge all destinations
 */
async function loadDestinations() {
  console.log('🎯 [DESTINATIONS] Loading all destinations...');
  
  try {
    const syncResult = await chrome.storage.sync.get(['webhookConfigs']);
    const localResult = await chrome.storage.local.get(['airtableConfigs']);
    
    const webhooks = syncResult.webhookConfigs || [];
    const airtableBases = localResult.airtableConfigs || [];
    
    console.log('🔍 [DEBUG] Storage contents:', {
      webhooks: webhooks.length,
      airtable: airtableBases.length,
      webhookData: webhooks,
      airtableData: airtableBases
    });
    
    destinations = [];
    
    // Add webhooks
    webhooks.forEach(webhook => {
      destinations.push({
        id: webhook.id,
        type: 'webhook',
        name: webhook.name,
        icon: '📤',
        displayName: `📤 ${webhook.name}`,
        config: webhook
      });
    });
    
    // Add Airtable bases
    airtableBases.forEach(base => {
      destinations.push({
        id: base.id,
        type: 'airtable',
        name: base.name,
        icon: '📊',
        displayName: `📊 ${base.name}`,
        config: base
      });
    });
    
    // 🔧 FIX: Update global reference
    window.destinations = destinations;
    
    console.log('🎯 [DESTINATIONS] Loaded:', {
      total: destinations.length,
      webhooks: webhooks.length,
      airtable: airtableBases.length,
      destinationsList: destinations
    });
    
    if (destinations.length === 0) {
      showStatus('⚠️ Keine Destinations konfiguriert. Bitte gehe zu Einstellungen.', 'info');
    }
    
    return destinations;
  } catch (error) {
    console.error('❌ [DESTINATIONS] Error loading destinations:', error);
    showStatus('❌ Fehler beim Laden der Destinations: ' + error.message, 'error');
    return [];
  }
}

/**
 * 🎯 KONZEPT A: Populate destination dropdown
 */
function populateDestinationDropdown() {
  console.log('🎯 [DROPDOWN] Populating destination dropdown...');
  
  const select = document.getElementById('destinationSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">Select destination...</option>';
  
  if (destinations.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No destinations configured';
    option.disabled = true;
    select.appendChild(option);
    return;
  }
  
  // Group webhooks
  const webhooks = destinations.filter(d => d.type === 'webhook');
  if (webhooks.length > 0) {
    const webhookGroup = document.createElement('optgroup');
    webhookGroup.label = '━━━━━━ WEBHOOKS ━━━━━━';
    webhooks.forEach(webhook => {
      const option = new Option(webhook.displayName, webhook.id);
      webhookGroup.appendChild(option);
    });
    select.appendChild(webhookGroup);
  }
  
  // Group Airtable bases
  const airtableBases = destinations.filter(d => d.type === 'airtable');
  if (airtableBases.length > 0) {
    const airtableGroup = document.createElement('optgroup');
    airtableGroup.label = '━━━━━━ AIRTABLE ━━━━━━';
    airtableBases.forEach(base => {
      const option = new Option(base.displayName, base.id);
      airtableGroup.appendChild(option);
    });
    select.appendChild(airtableGroup);
  }
  
  console.log('🎯 [DROPDOWN] Populated with', destinations.length, 'destinations');
}

/**
 * 🎯 KONZEPT A: Render fields based on selected destination
 */
async function renderFieldsForDestination(destinationId) {
  console.log('🎯 [RENDER] Rendering fields for:', destinationId);
  
  const dynamicContent = document.getElementById('dynamicContent');
  const dropzone = document.getElementById('dropzone');
  const sendBtn = document.getElementById('sendBtn');
  
  if (!dynamicContent) return;
  
  dynamicContent.innerHTML = '';
  
  if (!destinationId) {
    dropzone.style.display = 'none';
    sendBtn.textContent = 'Send';
    return;
  }
  
  const destination = destinations.find(d => d.id === destinationId);
  if (!destination) {
    console.error('❌ [RENDER] Destination not found:', destinationId);
    showStatus('❌ Destination nicht gefunden', 'error');
    return;
  }
  
  currentDestination = destination;
  
  try {
    if (destination.type === 'webhook') {
      await renderWebhookFields(destination);
      sendBtn.textContent = 'Send to Webhook';
    } else if (destination.type === 'airtable') {
      await renderAirtableFields(destination);
      sendBtn.textContent = 'Send to Airtable';
    }
    
    dropzone.style.display = 'block';
    
    // Restore saved form data
    await storage.restoreFormData(destinationId);
  } catch (error) {
    console.error('❌ [RENDER] Error rendering fields:', error);
    showStatus('❌ Fehler beim Rendern der Felder: ' + error.message, 'error');
  }
}

/**
 * Render webhook-specific fields
 */
async function renderWebhookFields(destination) {
  console.log('📤 [WEBHOOK] Rendering webhook fields');
  
  const dynamicContent = document.getElementById('dynamicContent');
  
  const html = `
    <div class="select-group template-group">
      <label for="templateSelect">Template:</label>
      <select id="templateSelect"></select>
    </div>
    <div id="templateDescription"></div>
    <div>
      <label for="notes">Notes and Responses:</label>
      <textarea id="notes" placeholder="Enter additional notes..." rows="10"></textarea>
    </div>
  `;
  
  dynamicContent.innerHTML = html;
  
  // Populate templates
  const templateSelect = document.getElementById('templateSelect');
  const templates = destination.config.templates || [];
  
  templateSelect.innerHTML = '<option value="">No Template</option>';
  templates.forEach(template => {
    const option = new Option(template.name, template.name);
    templateSelect.add(option);
  });
  
  // Add event listeners
  templateSelect.addEventListener('change', () => {
    updateTemplateDescription(destination.config);
    saveFormData();
  });
  
  document.getElementById('notes')?.addEventListener('input', () => {
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(saveFormData, 300);
  });
}

/**
 * Update template description
 */
function updateTemplateDescription(webhookConfig) {
  const templateSelect = document.getElementById('templateSelect');
  const descDiv = document.getElementById('templateDescription');
  
  if (!templateSelect || !descDiv) return;
  
  const selectedTemplate = templateSelect.value;
  if (!selectedTemplate) {
    descDiv.textContent = '';
    return;
  }
  
  const template = webhookConfig.templates?.find(t => t.name === selectedTemplate);
  if (template?.description) {
    descDiv.textContent = template.description;
  } else {
    descDiv.textContent = '';
  }
}

/**
 * Render Airtable-specific fields
 */
async function renderAirtableFields(destination) {
  console.log('📊 [AIRTABLE] Rendering Airtable fields');
  
  const dynamicContent = document.getElementById('dynamicContent');
  
  // Table selection dropdown
  const html = `
    <div class="select-group">
      <label for="airtableTableSelect">Table:</label>
      <select id="airtableTableSelect">
        <option value="">Select a Table</option>
      </select>
    </div>
    <div id="airtableLoader" class="loader" style="display: none;">
      <p>Fetching Airtable fields...</p>
    </div>
    <div id="airtableFieldMappings">
      <!-- Dynamic fields will be rendered here -->
    </div>
  `;
  
  dynamicContent.innerHTML = html;
  
  // Populate tables
  const tableSelect = document.getElementById('airtableTableSelect');
  const tables = destination.config.tables || [];
  
  tables.forEach(table => {
    const option = new Option(table.name, table.id);
    tableSelect.add(option);
  });
  
  // Add event listener
  tableSelect.addEventListener('change', async () => {
    await renderAirtableTableFields(destination, tableSelect.value);
    saveFormData();
  });
}

/**
 * Render Airtable table-specific fields
 * ✅ WORKAROUND: Uses fetchCollaboratorsFromRecords instead of API
 */
async function renderAirtableTableFields(destination, tableId) {
  console.log('📊 [AIRTABLE] Rendering table fields for:', tableId);
  
  const mappingsContainer = document.getElementById('airtableFieldMappings');
  const loader = document.getElementById('airtableLoader');
  
  if (!mappingsContainer) return;
  
  mappingsContainer.innerHTML = '';
  
  if (!tableId) {
    mappingsContainer.innerHTML = `<div class="info-state"><p>Bitte wähle eine Tabelle aus.</p></div>`;
    return;
  }
  
  loader.style.display = 'block';
  
  try {
    const tableSchema = destination.config.tables?.find(t => t.id === tableId);
    const tableConfig = destination.config.configuredTables?.[tableId];
    
    if (!tableSchema || !tableConfig) {
      mappingsContainer.innerHTML = `<div class="info-state error"><p>Konfiguration für diese Tabelle fehlt.</p></div>`;
      loader.style.display = 'none';
      return;
    }
    
    if (!tableSchema.fieldsLoaded) {
      mappingsContainer.innerHTML = `
        <div class="info-state">
          <p>Felder für diese Tabelle wurden noch nicht geladen.</p>
          <p>Bitte gehe zu den Einstellungen und klicke auf "Felder laden".</p>
        </div>
      `;
      loader.style.display = 'none';
      return;
    }
    
    // ✅ WORKAROUND: Load collaborators from existing records
    const collaboratorFields = tableSchema.fields.filter(
      f => f.type === 'singleCollaborator' || f.type === 'multipleCollaborators'
    );
    
    let collaboratorsList = [];
    if (collaboratorFields.length > 0) {
      console.log('👥 [COLLAB-WORKAROUND] Found collaborator fields, loading from records...');
      try {
        collaboratorsList = await airtableManager.fetchCollaboratorsFromRecords(
          { token: destination.config.token, baseId: destination.config.baseId },
          tableId
        );
        console.log('✅ [COLLAB-WORKAROUND] Loaded collaborators:', collaboratorsList.length);
        
        if (collaboratorsList.length === 0) {
          showStatus('ℹ️ Keine Bearbeiter in bestehenden Einträgen gefunden', 'info');
        }
      } catch (error) {
        console.error('❌ [COLLAB-WORKAROUND] Failed to load collaborators:', error);
        showStatus('⚠️ Warnung: Bearbeiter konnten nicht geladen werden: ' + error.message, 'error');
      }
    }
    
    // Render notes field
    const notesFieldId = tableConfig.fieldMappings?.notes;
    if (notesFieldId) {
      const notesField = tableSchema.fields.find(f => f.id === notesFieldId);
      if (notesField) {
        const notesEl = createFieldElement(notesField, collaboratorsList, 'airtable-field-notes');
        mappingsContainer.appendChild(notesEl);
      }
    }
    
    // Render custom fields
    if (tableConfig.selectedCustomFields?.length > 0) {
      tableConfig.selectedCustomFields.forEach(fieldId => {
        const field = tableSchema.fields.find(f => f.id === fieldId);
        if (field) {
          const fieldEl = createFieldElement(field, collaboratorsList);
          mappingsContainer.appendChild(fieldEl);
        }
      });
    }
    
    if (mappingsContainer.innerHTML === '') {
      mappingsContainer.innerHTML = `<div class="info-state"><p>Keine zusätzlichen Felder konfiguriert.</p></div>`;
    }
    
    loader.style.display = 'none';
    
    // Restore saved data
    await storage.restoreAirtableTableData(destination.config.baseId, tableId);
  } catch (error) {
    console.error('❌ [AIRTABLE] Error rendering table fields:', error);
    mappingsContainer.innerHTML = `<div class="info-state error"><p>Fehler beim Laden der Felder: ${error.message}</p></div>`;
    loader.style.display = 'none';
    showStatus('❌ Fehler beim Laden der Airtable-Felder: ' + error.message, 'error');
  }
}

/**
 * Create field element for Airtable
 */
function createFieldElement(field, collaborators = [], elementId = null) {
  const div = document.createElement('div');
  div.className = 'form-group';

  const label = document.createElement('label');
  label.textContent = field.name;
  label.htmlFor = elementId || `airtable-field-${field.id}`;
  div.appendChild(label);

  let input;
  const fieldType = field.type;

  switch (fieldType) {
    case 'multilineText':
    case 'richText':
      input = document.createElement('textarea');
      input.rows = 3;
      break;
    case 'checkbox':
      input = document.createElement('input');
      input.type = 'checkbox';
      div.classList.add('checkbox-group');
      div.innerHTML = '';
      div.appendChild(input);
      div.appendChild(label);
      break;
    case 'singleCollaborator':
    case 'multipleCollaborators':
      input = document.createElement('select');
      input.multiple = fieldType === 'multipleCollaborators';
      
      if (collaborators.length === 0) {
        input.innerHTML = '<option value="">Keine Bearbeiter in Einträgen gefunden</option>';
      } else {
        input.innerHTML = '<option value="">Select...</option>' + 
          collaborators.map(c => {
            const optionText = c.name + (c.email ? ` (${c.email})` : '');
            return `<option value="${c.id}">${optionText}</option>`;
          }).join('');
      }
      break;
    case 'singleSelect':
      input = document.createElement('select');
      const choices = field.options?.choices || [];
      input.innerHTML = '<option value="">Select...</option>' + 
        choices.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      break;
    case 'number':
    case 'currency':
    case 'percent':
      input = document.createElement('input');
      input.type = 'number';
      if (field.options?.precision) {
        input.step = '0.' + '1'.padStart(field.options.precision, '0');
      }
      break;
    case 'date':
    case 'dateTime':
      input = document.createElement('input');
      input.type = fieldType === 'date' ? 'date' : 'datetime-local';
      break;
    default:
      input = document.createElement('input');
      input.type = 'text';
  }

  if (fieldType !== 'checkbox') {
    div.appendChild(input);
  }
  
  input.id = label.htmlFor;
  input.dataset.airtableFieldId = field.id;
  input.dataset.airtableFieldType = field.type;

  input.addEventListener('input', () => {
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(saveFormData, 300);
  });

  return div;
}

/**
 * Save form data
 */
async function saveFormData() {
  if (!currentDestination) return;
  
  try {
    const formData = {
      destinationId: currentDestination.id,
      destinationType: currentDestination.type
    };
    
    if (currentDestination.type === 'webhook') {
      formData.notes = document.getElementById('notes')?.value || '';
      formData.selectedTemplate = document.getElementById('templateSelect')?.value || '';
    } else if (currentDestination.type === 'airtable') {
      const tableId = document.getElementById('airtableTableSelect')?.value;
      formData.selectedTableId = tableId;
      
      if (tableId) {
        formData.airtableData = storage.getAirtableFormState();
        await storage.saveAirtableTableData(currentDestination.config.baseId, tableId, formData.airtableData);
      }
    }
    
    await storage.saveGeneralFormData(formData);
  } catch (error) {
    console.error('❌ [SAVE] Error saving form data:', error);
    showStatus('❌ Fehler beim Speichern: ' + error.message, 'error');
  }
}

/**
 * Clear form data
 */
async function clearFormData() {
  try {
    document.getElementById('dynamicContent').innerHTML = '';
    fileHandler.clearAttachments();
    
    if (currentDestination?.type === 'airtable') {
      const tableId = document.getElementById('airtableTableSelect')?.value;
      if (tableId) {
        await storage.clearAirtableTableData(currentDestination.config.baseId, tableId);
      }
    }
    
    await storage.saveGeneralFormData({});
    showStatus('Formular geleert', 'info');
  } catch (error) {
    console.error('❌ [CLEAR] Error clearing form:', error);
    showStatus('❌ Fehler beim Löschen: ' + error.message, 'error');
  }
}

/**
 * Initialize the popup
 */
async function initializePopup() {
  if (isInitialized) return;
  isInitialized = true;

  console.log('🚀 [INIT] Popup opened - KONZEPT A v17 (WORKAROUND)');

  window.showStatus = showStatus;
  window.clearFormData = clearFormData;

  try {
    await storage.initializeMigration();
    await theme.init();
    fileHandler.init();
    webhookManager.init();
    airtableManager.init();

    // Load destinations
    await loadDestinations();
    populateDestinationDropdown();

    // Restore saved state
    const savedData = await storage.loadGeneralFormData();
    if (savedData?.destinationId) {
      document.getElementById('destinationSelect').value = savedData.destinationId;
      await renderFieldsForDestination(savedData.destinationId);
    }

    setupEventListeners();
    
    console.log('✅ [INIT] Popup initialization completed');
  } catch (error) {
    console.error('❌ [INIT] Initialization error:', error);
    showStatus('❌ Fehler beim Initialisieren: ' + error.message, 'error');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  document.getElementById('destinationSelect')?.addEventListener('change', async (e) => {
    await renderFieldsForDestination(e.target.value);
    saveFormData();
  });

  document.getElementById('sendBtn')?.addEventListener('click', () => sender.send());
  
  document.getElementById('clearBtn')?.addEventListener('click', async () => {
    if (confirm('Alle Formulardaten löschen?')) await clearFormData();
  });
  
  document.getElementById('closePopup')?.addEventListener('click', () => window.close());
  
  // 🔧 FIX: Load webhook list when opening config dialog
  document.getElementById('settingsBtn')?.addEventListener('click', () => {
    document.getElementById('configDialog')?.classList.add('active');
    webhookManager.renderWebhookList();
    airtableManager.renderAirtableList();
  });
  
  document.getElementById('closeConfigBtn')?.addEventListener('click', async () => {
    document.getElementById('configDialog')?.classList.remove('active');
    await loadDestinations();
    populateDestinationDropdown();
  });

  const webhooksTab = document.getElementById('webhooksTab');
  const airtableTab = document.getElementById('airtableTab');
  
  webhooksTab?.addEventListener('click', () => {
    webhooksTab.classList.add('active');
    airtableTab?.classList.remove('active');
    document.getElementById('webhookList').style.display = 'block';
    document.getElementById('airtableList').style.display = 'none';
    document.getElementById('addWebhookBtn').style.display = 'block';
    document.getElementById('addAirtableBtn').style.display = 'none';
    webhookManager.renderWebhookList();
  });

  airtableTab?.addEventListener('click', () => {
    airtableTab.classList.add('active');
    webhooksTab?.classList.remove('active');
    document.getElementById('webhookList').style.display = 'none';
    document.getElementById('airtableList').style.display = 'block';
    document.getElementById('addWebhookBtn').style.display = 'none';
    document.getElementById('addAirtableBtn').style.display = 'block';
    airtableManager.renderAirtableList();
  });
}

document.addEventListener('DOMContentLoaded', initializePopup);
