/**
 * Airtable Manager Module - V13 WORKAROUND
 * MISSION: Load collaborators from existing records (WORKAROUND)
 */

import { rateLimiter } from './rateLimiter.js';

export const airtableManager = {
  /**
   * Initialize the Airtable manager
   */
  init() {
    document.getElementById('addAirtableBtn')?.addEventListener('click', () => this.addAirtableBase());
  },

  /**
   * PHASE 1: Fetch only table names (minimal data)
   */
  async fetchTableNames({ token, baseId }) {
    if (!token || !baseId) {
      throw new Error('Missing Token or Base ID.');
    }

    if (!token.startsWith('pat')) {
      throw new Error('Invalid token format. Token must start with "pat"');
    }

    if (!baseId.startsWith('app')) {
      throw new Error('Invalid Base ID format. Base ID must start with "app"');
    }

    const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
    
    console.log('🔌 [API] Fetching table names:', {
      url,
      baseId,
      hasToken: !!token,
      tokenPrefix: token.substring(0, 10) + '...'
    });
    
    const response = await rateLimiter.throttle(baseId, async () => {
      return await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    });

    console.log('📡 [API] Table names response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [API] Table names error:', errorData);
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [API] Table names fetched:', data.tables?.length || 0);
    
    return (data.tables || []).map(table => ({
      id: table.id,
      name: table.name,
      fieldsLoaded: false
    }));
  },

  /**
   * PHASE 2: Fetch field details for a specific table (on-demand)
   */
  async fetchTableFields({ token, baseId }, tableId) {
    if (!token || !baseId || !tableId) {
      throw new Error('Missing Token, Base ID, or Table ID.');
    }

    if (!token.startsWith('pat')) {
      throw new Error('Invalid token format. Token must start with "pat"');
    }

    if (!baseId.startsWith('app')) {
      throw new Error('Invalid Base ID format. Base ID must start with "app"');
    }

    if (!tableId.startsWith('tbl')) {
      throw new Error('Invalid Table ID format. Table ID must start with "tbl"');
    }

    const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
    
    console.log('🔌 [API] Fetching table fields:', {
      url,
      baseId,
      tableId,
      hasToken: !!token,
      tokenPrefix: token.substring(0, 10) + '...'
    });
    
    const response = await rateLimiter.throttle(baseId, async () => {
      return await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    });

    console.log('📡 [API] Table fields response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [API] Table fields error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [API] Received data:', {
      tablesCount: data.tables?.length || 0,
      tableIds: data.tables?.map(t => t.id) || []
    });

    const table = data.tables?.find(t => t.id === tableId);
    
    if (!table) {
      console.error('❌ [API] Table not found in response:', {
        requestedTableId: tableId,
        availableTableIds: data.tables?.map(t => t.id) || []
      });
      throw new Error(`Table ${tableId} not found in base ${baseId}`);
    }

    console.log('✅ [API] Table found:', {
      id: table.id,
      name: table.name,
      fieldsCount: table.fields?.length || 0
    });

    return {
      id: table.id,
      name: table.name,
      primaryFieldId: table.primaryFieldId,
      fieldsLoaded: true,
      fields: table.fields.map(field => ({
        id: field.id,
        name: field.name,
        type: field.type,
        ...(field.type === 'singleSelect' || field.type === 'multipleSelects' 
          ? { options: { choices: field.options?.choices || [] } } 
          : {}),
        // Keep collaborator field metadata, but NOT the choices
        ...(field.type === 'singleCollaborator' || field.type === 'multipleCollaborators'
          ? { options: {} }  // Empty options - will be loaded from records
          : {})
      }))
    };
  },

  /**
   * ✅ WORKAROUND: Fetch collaborators from existing records
   * This is the RELIABLE method that works!
   */
  async fetchCollaboratorsFromRecords({ token, baseId }, tableId) {
    if (!token || !baseId || !tableId) {
      throw new Error('Missing Token, Base ID, or Table ID.');
    }

    console.log('👥 [COLLAB-WORKAROUND] Fetching collaborators from records:', {
      baseId,
      tableId
    });

    // Step 1: Get table schema to find collaborator fields
    const schemaUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
    
    const schemaResponse = await rateLimiter.throttle(baseId, async () => {
      return await fetch(schemaUrl, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    });

    if (!schemaResponse.ok) {
      throw new Error(`Failed to fetch table schema: ${schemaResponse.statusText}`);
    }

    const schemaData = await schemaResponse.json();
    const table = schemaData.tables?.find(t => t.id === tableId);
    
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }

    // Find collaborator fields
    const collaboratorFields = table.fields.filter(
      f => f.type === 'singleCollaborator' || f.type === 'multipleCollaborators'
    );

    if (collaboratorFields.length === 0) {
      console.log('ℹ️ [COLLAB-WORKAROUND] No collaborator fields in this table');
      return [];
    }

    console.log('👥 [COLLAB-WORKAROUND] Found collaborator fields:', {
      count: collaboratorFields.length,
      fields: collaboratorFields.map(f => ({ id: f.id, name: f.name, type: f.type }))
    });

    // Step 2: Fetch records to extract collaborators
    const recordsUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?maxRecords=100`;
    
    const recordsResponse = await rateLimiter.throttle(baseId, async () => {
      return await fetch(recordsUrl, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    });

    if (!recordsResponse.ok) {
      const errorData = await recordsResponse.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to fetch records: ${recordsResponse.statusText}`);
    }

    const recordsData = await recordsResponse.json();
    const records = recordsData.records || [];

    console.log('📊 [COLLAB-WORKAROUND] Fetched records:', {
      count: records.length
    });

    // Step 3: Extract unique collaborators from records
    const collaboratorsMap = new Map();
    
    records.forEach(record => {
      collaboratorFields.forEach(field => {
        const fieldValue = record.fields[field.name];
        
        if (!fieldValue) return;
        
        // Handle both single and multiple collaborators
        const collaborators = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
        
        collaborators.forEach(collab => {
          if (collab && collab.id && !collaboratorsMap.has(collab.id)) {
            collaboratorsMap.set(collab.id, {
              id: collab.id,
              name: collab.name || 'Unknown',
              email: collab.email || ''
            });
          }
        });
      });
    });

    const collaboratorsList = Array.from(collaboratorsMap.values());

    console.log('✅ [COLLAB-WORKAROUND] Extracted collaborators:', {
      count: collaboratorsList.length,
      collaborators: collaboratorsList
    });

    return collaboratorsList;
  },

  /**
   * Load Airtable configurations
   */
  async loadConfigurations() {
    console.log('📂 [LOAD] Starting loadConfigurations...');
    
    const result = await chrome.storage.local.get(['airtableConfigs']);
    const configs = result.airtableConfigs || [];
    
    console.log('📂 [LOAD] Loaded configs from storage:', {
      count: configs.length,
      configIds: configs.map(c => c.id),
      configNames: configs.map(c => c.name)
    });
    
    const airtableBaseSelect = document.getElementById('airtableBaseSelect');
    if (airtableBaseSelect) {
      airtableBaseSelect.innerHTML = '<option value="">Select a Base</option>';
      configs.forEach(config => {
        const option = new Option(config.name, config.id);
        airtableBaseSelect.add(option);
      });
    }

    this.renderAirtableList();
    console.log('📂 [LOAD] loadConfigurations completed');
  },

  /**
   * Render Airtable base list
   */
  async renderAirtableList() {
    console.log('🎨 [RENDER] Starting renderAirtableList...');
    
    const result = await chrome.storage.local.get(['airtableConfigs']);
    const configs = result.airtableConfigs || [];
    const airtableList = document.getElementById('airtableList');
    
    console.log('🎨 [RENDER] Rendering list with', configs.length, 'configs');
    
    if (!airtableList) {
      console.error('🎨 [RENDER] airtableList element not found!');
      return;
    }
    
    airtableList.innerHTML = '';

    if (configs.length === 0) {
      airtableList.innerHTML = '<p class="empty-state">Noch keine Airtable-Verbindungen. Klicke auf "+ Hinzufügen" um zu starten.</p>';
      return;
    }

    configs.forEach((config, index) => {
      const item = this.createAirtableItem(config, index);
      airtableList.appendChild(item);
    });
    
    console.log('🎨 [RENDER] renderAirtableList completed');
  },

  /**
   * Create HTML for a single Airtable Base connection item
   */
  createAirtableItem(config, index) {
    const div = document.createElement('div');
    div.className = 'airtable-item';
    div.dataset.index = index;
    div.dataset.configId = config.id;
    div.innerHTML = `
      <div class="config-section">
        <label>Verbindungsname:</label>
        <input type="text" class="airtable-name" value="${config.name || ''}">
      </div>
      <div class="config-section">
        <label>Personal Access Token:</label>
        <input type="password" class="airtable-token" value="${config.token || ''}" placeholder="pat...">
      </div>
      <div class="config-section">
        <label>Base ID:</label>
        <input type="text" class="airtable-base" value="${config.baseId || ''}" placeholder="app...">
      </div>
      <div class="button-group">
        <button class="connect-base">
          <span class="button-text">Base verbinden & Tabellen laden</span>
        </button>
      </div>
      <div class="test-feedback"></div>
      <div class="tables-list-container">
        ${config.tables ? this.createTablesListHTML(config, index) : ''}
      </div>
      <div class="action-buttons">
        <button class="save-airtable">Verbindung speichern</button>
        <button class="delete-btn delete-airtable">Löschen</button>
      </div>
    `;
    this.attachAirtableItemListeners(div, index, config.id);
    return div;
  },

  /**
   * Create HTML for the list of tables within a base
   */
  createTablesListHTML(config, baseIndex) {
    if (!config.tables || config.tables.length === 0) {
      return '<p class="info-state">Keine Tabellen in dieser Base gefunden.</p>';
    }
    
    return `
      <h4 class="tables-header">Tabellen in Base (${config.tables.length})</h4>
      <div class="tables-list">
        ${config.tables.map((table, tableIndex) => this.createTableConfigSectionHTML(table, config, baseIndex, tableIndex)).join('')}
      </div>
    `;
  },

  /**
   * Create the collapsible configuration section for a single table
   */
  createTableConfigSectionHTML(table, config, baseIndex, tableIndex) {
    const tableConfig = config.configuredTables?.[table.id] || {};
    const isCollapsed = tableConfig.isCollapsed !== false;
    const fieldsLoaded = table.fieldsLoaded || false;

    return `
      <div class="table-config-item" data-table-id="${table.id}">
        <div class="collapsible-header ${isCollapsed ? 'collapsed' : ''}">
          <h5><span class="collapsible-icon">▼</span> ${table.name}</h5>
          <span class="field-count">${fieldsLoaded ? `${table.fields?.length || 0} Felder` : 'Felder nicht geladen'}</span>
        </div>
        <div class="collapsible-content ${isCollapsed ? 'collapsed' : ''}">
          ${fieldsLoaded ? this.createFieldMappingsHTML(table, config, baseIndex) : this.createLoadFieldsButtonHTML(baseIndex, table.id)}
        </div>
      </div>
    `;
  },

  /**
   * Create "Load Fields" button for tables without loaded fields
   */
  createLoadFieldsButtonHTML(baseIndex, tableId) {
    return `
      <div class="load-fields-section">
        <p class="info-state">Felder wurden noch nicht geladen.</p>
        <button class="load-fields-btn" data-base-index="${baseIndex}" data-table-id="${tableId}">
          Felder laden
        </button>
      </div>
    `;
  },

  /**
   * Create field mappings HTML
   */
  createFieldMappingsHTML(table, config, baseIndex) {
    const tableConfig = config.configuredTables?.[table.id] || {};
    const mappedFieldIds = Object.values(tableConfig.fieldMappings || {});

    return `
      <div class="field-mappings">
        <h6>Standard-Feld-Zuordnungen</h6>
        <div class="field-mapping-row"><label>URL:</label><select class="field-mapping" data-field="url">${this.createFieldOptions(table.fields, tableConfig.fieldMappings?.url)}</select></div>
        <div class="field-mapping-row"><label>Titel:</label><select class="field-mapping" data-field="title">${this.createFieldOptions(table.fields, tableConfig.fieldMappings?.title)}</select></div>
        <div class="field-mapping-row"><label>Notizen:</label><select class="field-mapping" data-field="notes">${this.createFieldOptions(table.fields, tableConfig.fieldMappings?.notes)}</select></div>
        <div class="field-mapping-row"><label>Anhänge:</label><select class="field-mapping" data-field="attachments">${this.createFieldOptions(table.fields, tableConfig.fieldMappings?.attachments, 'multipleAttachments')}</select></div>
      </div>
      <hr class="divider">
      <div class="custom-fields-selector">
        <h6>Zusätzliche Felder im Popup anzeigen</h6>
        <div class="custom-fields-grid">
          ${table.fields
            .filter(field => !mappedFieldIds.includes(field.id))
            .map(field => `
              <div class="custom-field-checkbox">
                <input type="checkbox" id="custom-field-${baseIndex}-${table.id}-${field.id}" data-field-id="${field.id}" 
                       ${(tableConfig.selectedCustomFields || []).includes(field.id) ? 'checked' : ''}>
                <label for="custom-field-${baseIndex}-${table.id}-${field.id}">${field.name}</label>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  },

  /**
   * Create field options for a dropdown select
   */
  createFieldOptions(fields, selectedField, fieldTypeFilter = null) {
    let options = '<option value="">-- Nicht zuordnen --</option>';
    fields.forEach(field => {
      if (fieldTypeFilter && field.type !== fieldTypeFilter) return;
      const selected = field.id === selectedField ? 'selected' : '';
      options += `<option value="${field.id}" ${selected}>${field.name} (${field.type})</option>`;
    });
    return options;
  },

  /**
   * Attach event listeners
   */
  attachAirtableItemListeners(div, index, configId) {
    div.querySelector('.connect-base')?.addEventListener('click', () => this.connectAndFetchTableNames(configId));
    div.querySelector('.save-airtable')?.addEventListener('click', () => this.saveAirtableConnection(configId));
    div.querySelector('.delete-airtable')?.addEventListener('click', () => {
      if (confirm('Diese gesamte Airtable-Base-Verbindung löschen?')) this.deleteAirtableBase(configId);
    });
    
    div.querySelectorAll('.collapsible-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const tableId = e.currentTarget.closest('.table-config-item').dataset.tableId;
        this.toggleCollapsible(configId, tableId);
      });
    });

    div.querySelectorAll('.load-fields-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tableId = e.target.dataset.tableId;
        this.loadTableFields(configId, tableId);
      });
    });
  },

  /**
   * Toggle collapsible section for a table
   */
  async toggleCollapsible(configId, tableId) {
    console.log('🔽 [TOGGLE] Toggling collapse for:', { configId, tableId });
    
    const result = await chrome.storage.local.get(['airtableConfigs']);
    const configs = result.airtableConfigs || [];
    const config = configs.find(c => c.id === configId);
    
    if (!config) {
      console.error('❌ [TOGGLE] Config not found:', configId);
      return;
    }

    if (!config.configuredTables) {
      config.configuredTables = {};
    }

    if (!config.configuredTables[tableId]) {
      config.configuredTables[tableId] = { isCollapsed: false };
    } else {
      config.configuredTables[tableId].isCollapsed = !config.configuredTables[tableId].isCollapsed;
    }

    await chrome.storage.local.set({ airtableConfigs: configs });
    console.log('💾 [TOGGLE] Saved collapse state');
    
    this.renderAirtableList();
  },

  /**
   * Show feedback message within a connection item
   */
  showFeedback(configId, type, message) {
    const feedback = document.querySelector(`.airtable-item[data-config-id="${configId}"] .test-feedback`);
    if (!feedback) return;
    feedback.className = `test-feedback visible ${type}`;
    const icons = { testing: '🔄', success: '✅', error: '❌', progress: '⏳' };
    feedback.innerHTML = `<span>${icons[type]}</span> <span>${message}</span>`;
    if (type !== 'testing' && type !== 'progress') {
      setTimeout(() => feedback.classList.remove('visible'), 5000);
    }
  },

  /**
   * PHASE 1: Connect to base and fetch only table names
   */
  async connectAndFetchTableNames(configId) {
    console.log('🔌 [CONNECT] Starting connection for config:', configId);
    
    const item = document.querySelector(`.airtable-item[data-config-id="${configId}"]`);
    const token = item.querySelector('.airtable-token').value.trim();
    const baseId = item.querySelector('.airtable-base').value.trim();
    const connectBtn = item.querySelector('.connect-base');

    if (!token || !baseId) {
      this.showFeedback(configId, 'error', 'Bitte Token und Base ID angeben');
      return;
    }

    if (!token.startsWith('pat')) {
      this.showFeedback(configId, 'error', 'Token muss mit "pat" beginnen');
      return;
    }

    if (!baseId.startsWith('app')) {
      this.showFeedback(configId, 'error', 'Base ID muss mit "app" beginnen');
      return;
    }

    connectBtn.disabled = true;
    connectBtn.classList.add('loading');
    this.showFeedback(configId, 'testing', 'Verbinde mit Base...');

    try {
      const tables = await this.fetchTableNames({ token, baseId });
      console.log('🔌 [CONNECT] Fetched tables:', tables.length);
      
      const result = await chrome.storage.local.get(['airtableConfigs']);
      const configs = result.airtableConfigs || [];
      const config = configs.find(c => c.id === configId);

      if (!config) {
        throw new Error('Config not found');
      }

      config.token = token;
      config.baseId = baseId;
      config.tables = tables;
      config.configuredTables = config.configuredTables || {};

      console.log('💾 [CONNECT] Saving config with tables...');
      await chrome.storage.local.set({ airtableConfigs: configs });
      
      this.showFeedback(configId, 'success', `✅ Erfolgreich! ${tables.length} Tabellen gefunden.`);
      
      this.renderAirtableList();

    } catch (error) {
      console.error('❌ [CONNECT] Error:', error);
      this.showFeedback(configId, 'error', `Fehler: ${error.message}`);
    } finally {
      connectBtn.disabled = false;
      connectBtn.classList.remove('loading');
    }
  },

  /**
   * PHASE 2: Load field details for a specific table
   */
  async loadTableFields(configId, tableId) {
    console.log('📥 [FIELDS] Loading fields for:', { configId, tableId });
    
    const result = await chrome.storage.local.get(['airtableConfigs']);
    const configs = result.airtableConfigs || [];
    const config = configs.find(c => c.id === configId);

    if (!config || !config.token || !config.baseId) {
      window.showStatus('Fehler: Keine gültige Verbindung gefunden', 'error');
      return;
    }

    if (!config.token.startsWith('pat')) {
      window.showStatus('Fehler: Ungültiges Token-Format', 'error');
      return;
    }

    if (!config.baseId.startsWith('app')) {
      window.showStatus('Fehler: Ungültige Base ID', 'error');
      return;
    }

    if (!tableId.startsWith('tbl')) {
      window.showStatus('Fehler: Ungültige Table ID', 'error');
      return;
    }

    const btn = document.querySelector(`.load-fields-btn[data-table-id="${tableId}"]`);
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Lädt...';
    }

    try {
      const tableWithFields = await this.fetchTableFields(
        { token: config.token, baseId: config.baseId },
        tableId
      );
      console.log('📥 [FIELDS] Fetched fields:', tableWithFields.fields.length);

      const tableIndex = config.tables.findIndex(t => t.id === tableId);
      if (tableIndex !== -1) {
        config.tables[tableIndex] = tableWithFields;

        if (!config.configuredTables[tableId]) {
          config.configuredTables[tableId] = {
            fieldMappings: this.autoMapFields(tableWithFields.fields),
            selectedCustomFields: [],
            isCollapsed: false
          };
        }

        console.log('💾 [FIELDS] Saving to storage...');
        await chrome.storage.local.set({ airtableConfigs: configs });

        window.showStatus(`Felder für "${tableWithFields.name}" geladen`, 'success');
        this.renderAirtableList();
      }

    } catch (error) {
      console.error('❌ [FIELDS] Error:', error);
      window.showStatus(`Fehler beim Laden der Felder: ${error.message}`, 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Felder laden';
      }
    }
  },

  /**
   * Auto-map fields based on common names
   */
  autoMapFields(fields) {
    const mappings = {};
    const patterns = {
      url: ['url', 'link', 'website'],
      title: ['title', 'name', 'subject', 'titel'],
      notes: ['notes', 'description', 'body', 'notizen', 'beschreibung'],
      attachments: ['attachments', 'files', 'media', 'anhänge', 'dateien']
    };
    for (const [key, keywords] of Object.entries(patterns)) {
      const field = fields.find(f => {
        if (key === 'attachments' && f.type !== 'multipleAttachments') return false;
        return keywords.some(kw => f.name.toLowerCase().includes(kw));
      });
      if (field) mappings[key] = field.id;
    }
    return mappings;
  },

  /**
   * Add a new, empty Airtable base connection
   */
  async addAirtableBase() {
    console.log('➕ [ADD] Adding new Airtable base...');
    
    const result = await chrome.storage.local.get(['airtableConfigs']);
    const configs = result.airtableConfigs || [];
    
    const newConfig = {
      id: `airtable_${Date.now()}`,
      name: `Airtable Base ${configs.length + 1}`,
      token: '',
      baseId: '',
      tables: null,
      configuredTables: {}
    };
    
    configs.push(newConfig);
    await chrome.storage.local.set({ airtableConfigs: configs });
    
    this.renderAirtableList();
  },

  /**
   * Save an entire Airtable base connection
   */
  async saveAirtableConnection(configId) {
    console.log('💾 [SAVE] Starting save for config:', configId);
    
    const item = document.querySelector(`.airtable-item[data-config-id="${configId}"]`);
    if (!item) {
      console.error('❌ [SAVE] Item not found for config:', configId);
      window.showStatus('Fehler: Konfiguration nicht gefunden', 'error');
      return;
    }

    const result = await chrome.storage.local.get(['airtableConfigs']);
    const configs = result.airtableConfigs || [];
    const config = configs.find(c => c.id === configId);

    if (!config) {
      console.error('❌ [SAVE] Config not found in storage:', configId);
      window.showStatus('Fehler: Konfiguration nicht gefunden', 'error');
      return;
    }

    config.name = item.querySelector('.airtable-name').value.trim();
    config.token = item.querySelector('.airtable-token').value.trim();
    config.baseId = item.querySelector('.airtable-base').value.trim();
    
    let savedTablesCount = 0;
    item.querySelectorAll('.table-config-item').forEach(tableItem => {
      const tableId = tableItem.dataset.tableId;
      const table = config.tables?.find(t => t.id === tableId);
      
      if (table && table.fieldsLoaded) {
        if (!config.configuredTables[tableId]) {
          config.configuredTables[tableId] = {};
        }
        
        const tableConfig = config.configuredTables[tableId];
        tableConfig.fieldMappings = {};
        
        tableItem.querySelectorAll('.field-mapping').forEach(select => {
          tableConfig.fieldMappings[select.dataset.field] = select.value;
        });

        tableConfig.selectedCustomFields = [];
        tableItem.querySelectorAll('.custom-field-checkbox input:checked').forEach(checkbox => {
          tableConfig.selectedCustomFields.push(checkbox.dataset.fieldId);
        });
        
        savedTablesCount++;
      }
    });

    await chrome.storage.local.set({ airtableConfigs: configs });

    const airtableBaseSelect = document.getElementById('airtableBaseSelect');
    if (airtableBaseSelect) {
      const option = airtableBaseSelect.querySelector(`option[value="${config.id}"]`);
      if (option) {
        option.text = config.name;
      }
    }
    
    window.showStatus('✅ Airtable-Verbindung erfolgreich gespeichert', 'success');
  },

  /**
   * Delete an Airtable base connection
   */
  async deleteAirtableBase(configId) {
    console.log('🗑️ [DELETE] Deleting config:', configId);
    
    const result = await chrome.storage.local.get(['airtableConfigs']);
    const configs = result.airtableConfigs || [];
    
    const configIndex = configs.findIndex(c => c.id === configId);
    if (configIndex === -1) {
      console.error('❌ [DELETE] Config not found:', configId);
      return;
    }
    
    const deletedConfig = configs[configIndex];
    configs.splice(configIndex, 1);
    
    await chrome.storage.local.set({ airtableConfigs: configs });
    
    console.log('🗑️ [DELETE] Deleted config:', deletedConfig?.name);
    
    await this.loadConfigurations();
    window.showStatus('Airtable-Verbindung gelöscht', 'success');
  }
};
