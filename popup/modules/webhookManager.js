/**
 * Webhook Manager Module - Handles webhook configuration UI
 * Version 1.9 - Enhanced with unified export/import and legacy format support
 */

export const webhookManager = {
  /**
   * Initialize the webhook manager
   */
  init() {
    const addWebhookBtn = document.getElementById('addWebhookBtn');
    const importBtn = document.getElementById('importBtn');
    const exportBtn = document.getElementById('exportBtn');

    if (addWebhookBtn) {
      addWebhookBtn.addEventListener('click', () => this.addWebhook());
    }

    if (importBtn) {
      importBtn.addEventListener('click', () => this.importConfigurations());
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportConfigurations());
    }
  },

  /**
   * Load webhook configurations
   */
  async loadConfigurations() {
    const result = await chrome.storage.sync.get(['webhookConfigs', 'lastSelectedWebhookId']);
    const configs = result.webhookConfigs || [];
    const lastSelectedId = result.lastSelectedWebhookId;

    // Update select dropdown
    const webhookSelect = document.getElementById('webhookSelect');
    if (webhookSelect) {
      webhookSelect.innerHTML = '';
      
      if (configs.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No webhooks configured';
        webhookSelect.appendChild(option);
      } else {
        configs.forEach(config => {
          const option = document.createElement('option');
          option.value = config.id;
          option.textContent = config.name;
          if (config.id === lastSelectedId) {
            option.selected = true;
          }
          webhookSelect.appendChild(option);
        });
      }
    }

    // Update template options
    await this.updateTemplateOptions();

    // Render list in config dialog
    this.renderWebhookList();
  },

  /**
   * Update template options based on selected webhook
   */
  async updateTemplateOptions() {
    const webhookSelect = document.getElementById('webhookSelect');
    const templateSelect = document.getElementById('templateSelect');
    
    if (!webhookSelect || !templateSelect) return;

    const selectedWebhookId = webhookSelect.value;
    
    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];
    const selectedConfig = configs.find(c => c.id === selectedWebhookId);

    templateSelect.innerHTML = '';

    if (!selectedConfig || !selectedConfig.templates || selectedConfig.templates.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No templates available';
      templateSelect.appendChild(option);
    } else {
      selectedConfig.templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.name;
        option.textContent = template.name;
        option.dataset.description = template.description || '';
        templateSelect.appendChild(option);
      });
    }

    this.updateTemplateDescription();
  },

  /**
   * Update template description
   */
  updateTemplateDescription() {
    const templateSelect = document.getElementById('templateSelect');
    const descriptionDiv = document.getElementById('templateDescription');
    
    if (!templateSelect || !descriptionDiv) return;

    const selectedOption = templateSelect.options[templateSelect.selectedIndex];
    const description = selectedOption?.dataset.description || '';
    
    descriptionDiv.textContent = description;
  },

  /**
   * Render webhook list in config dialog
   */
  renderWebhookList() {
    chrome.storage.sync.get(['webhookConfigs'], (result) => {
      const configs = result.webhookConfigs || [];
      const webhookList = document.getElementById('webhookList');
      
      if (!webhookList) return;

      webhookList.innerHTML = '';

      configs.forEach((config, index) => {
        const item = this.createWebhookItem(config, index);
        webhookList.appendChild(item);
      });
    });
  },

  /**
   * Create webhook item HTML
   */
  createWebhookItem(config, index) {
    const div = document.createElement('div');
    div.className = 'webhook-item';
    div.innerHTML = `
      <div class="config-section">
        <label>Webhook Name:</label>
        <input type="text" class="webhook-name" value="${config.name}" data-index="${index}">
      </div>
      <div class="config-section">
        <label>Webhook URL:</label>
        <input type="text" class="webhook-url" value="${config.url}" data-index="${index}">
      </div>
      <div class="config-section">
        <label>Templates:</label>
        <div class="template-list" data-index="${index}">
          ${config.templates.map((t, i) => `
            <div class="template-entry">
              <span class="template-tag">
                ${t.name}
                <button class="remove-template" data-webhook="${index}" data-template="${i}">×</button>
              </span>
              <input type="text" class="template-description" value="${t.description || ''}" 
                     data-webhook="${index}" data-template="${i}" placeholder="Description (optional)">
            </div>
          `).join('')}
        </div>
        <button class="add-template" data-index="${index}">+ Add Template</button>
      </div>
      <div class="action-buttons">
        <button class="save-webhook" data-index="${index}">Save</button>
        <button class="delete-btn delete-webhook" data-index="${index}">Delete</button>
      </div>
    `;

    // Add event listeners
    this.attachWebhookItemListeners(div, index);

    return div;
  },

  /**
   * Attach event listeners to webhook item
   */
  attachWebhookItemListeners(div, index) {
    // Add template button
    const addTemplateBtn = div.querySelector('.add-template');
    if (addTemplateBtn) {
      addTemplateBtn.addEventListener('click', () => this.addTemplate(index));
    }

    // Remove template buttons
    const removeTemplateBtns = div.querySelectorAll('.remove-template');
    removeTemplateBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const webhookIndex = parseInt(btn.dataset.webhook);
        const templateIndex = parseInt(btn.dataset.template);
        this.removeTemplate(webhookIndex, templateIndex);
      });
    });

    // Template description inputs
    const descriptionInputs = div.querySelectorAll('.template-description');
    descriptionInputs.forEach(input => {
      input.addEventListener('change', () => {
        const webhookIndex = parseInt(input.dataset.webhook);
        const templateIndex = parseInt(input.dataset.template);
        this.updateTemplateDescription(webhookIndex, templateIndex, input.value);
      });
    });

    // Save button
    const saveBtn = div.querySelector('.save-webhook');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveWebhook(index));
    }

    // Delete button
    const deleteBtn = div.querySelector('.delete-webhook');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('Delete this webhook?')) {
          this.deleteWebhook(index);
        }
      });
    }
  },

  /**
   * Add new template
   */
  async addTemplate(webhookIndex) {
    const templateName = prompt('Enter template name:');
    if (!templateName) return;

    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];

    if (configs[webhookIndex]) {
      configs[webhookIndex].templates.push({
        name: templateName,
        description: ''
      });
      await chrome.storage.sync.set({ webhookConfigs: configs });
      this.renderWebhookList();
      await this.loadConfigurations();
    }
  },

  /**
   * Remove template
   */
  async removeTemplate(webhookIndex, templateIndex) {
    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];

    if (configs[webhookIndex]) {
      configs[webhookIndex].templates.splice(templateIndex, 1);
      await chrome.storage.sync.set({ webhookConfigs: configs });
      this.renderWebhookList();
      await this.loadConfigurations();
    }
  },

  /**
   * Update template description
   */
  async updateTemplateDescription(webhookIndex, templateIndex, description) {
    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];

    if (configs[webhookIndex] && configs[webhookIndex].templates[templateIndex]) {
      configs[webhookIndex].templates[templateIndex].description = description;
      await chrome.storage.sync.set({ webhookConfigs: configs });
    }
  },

  /**
   * Add new webhook
   */
  async addWebhook() {
    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];

    const newConfig = {
      id: `webhook_${Date.now()}`,
      name: `Webhook ${configs.length + 1}`,
      url: '',
      templates: []
    };

    configs.push(newConfig);
    await chrome.storage.sync.set({ webhookConfigs: configs });

    this.renderWebhookList();
    await this.loadConfigurations();
  },

  /**
   * Save webhook
   */
  async saveWebhook(index) {
    const nameInput = document.querySelector(`.webhook-name[data-index="${index}"]`);
    const urlInput = document.querySelector(`.webhook-url[data-index="${index}"]`);

    if (!nameInput || !urlInput) return;

    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];

    if (configs[index]) {
      configs[index].name = nameInput.value.trim();
      configs[index].url = urlInput.value.trim();

      await chrome.storage.sync.set({ webhookConfigs: configs });
      await this.loadConfigurations();

      // Reload background worker
      chrome.runtime.reload();

      window.showStatus('Webhook saved', 'success');
    }
  },

  /**
   * Delete webhook
   */
  async deleteWebhook(index) {
    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];

    configs.splice(index, 1);
    await chrome.storage.sync.set({ webhookConfigs: configs });

    this.renderWebhookList();
    await this.loadConfigurations();

    // Reload background worker
    chrome.runtime.reload();

    window.showStatus('Webhook deleted', 'success');
  },

  /**
   * Export configurations (Unified: Webhooks + Airtable)
   */
  async exportConfigurations() {
    try {
      // ✅ FIX: Load from correct storage locations
      const webhookResult = await chrome.storage.sync.get(['webhookConfigs']);
      const airtableResult = await chrome.storage.local.get(['airtableConfigs']);
      
      const exportData = {
        version: '1.9',
        exportDate: new Date().toISOString(),
        webhooks: webhookResult.webhookConfigs || [],
        airtable: airtableResult.airtableConfigs || []
      };

      console.log('📤 [EXPORT] Exporting:', {
        webhooks: exportData.webhooks.length,
        airtable: exportData.airtable.length
      });

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `url-clipper-config-${Date.now()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      window.showStatus('Configuration exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      window.showStatus('Export failed: ' + error.message, 'error');
    }
  },

  /**
   * Detect import format and normalize data
   * Supports:
   * 1. Legacy v1.7 Array: [{id, label, url, templates}]
   * 2. Legacy v1.7 Object: {webhooks: [...]}
   * 3. New v1.9 Unified: {version: '1.9', webhooks: [...], airtable: [...]}
   */
  detectAndNormalizeImportFormat(importData) {
    let webhookConfigs = [];
    let airtableConfigs = [];
    let detectedFormat = 'unknown';

    // Format 1: Legacy Array [{id, label, url, templates}]
    if (Array.isArray(importData)) {
      detectedFormat = 'legacy-array';
      webhookConfigs = importData.map(webhook => ({
        id: webhook.id,
        name: webhook.label || webhook.name || 'Unnamed Webhook', // Map label → name
        url: webhook.url || '',
        templates: webhook.templates || []
      }));
    }
    // Format 2: Legacy Object {webhooks: [...]}
    else if (importData.webhooks && !importData.version) {
      detectedFormat = 'legacy-object';
      webhookConfigs = importData.webhooks.map(webhook => ({
        id: webhook.id,
        name: webhook.label || webhook.name || 'Unnamed Webhook', // Map label → name
        url: webhook.url || '',
        templates: webhook.templates || []
      }));
    }
    // Format 3: New Unified {version: '1.9', webhooks: [...], airtable: [...]}
    else if (importData.version === '1.9') {
      detectedFormat = 'unified-v1.9';
      webhookConfigs = importData.webhooks || [];
      airtableConfigs = importData.airtable || [];
    }
    else {
      throw new Error('Unrecognized configuration format');
    }

    return {
      webhookConfigs,
      airtableConfigs,
      detectedFormat
    };
  },

  /**
   * Import configurations (Unified: Webhooks + Airtable)
   * Now supports legacy v1.7 formats!
   */
  importConfigurations() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      try {
        const file = e.target.files[0];
        if (!file) return;

        const text = await file.text();
        const importData = JSON.parse(text);

        // Detect format and normalize
        const { webhookConfigs, airtableConfigs, detectedFormat } = 
          this.detectAndNormalizeImportFormat(importData);

        // Build confirmation message
        let formatInfo = '';
        if (detectedFormat === 'legacy-array') {
          formatInfo = '📦 Legacy v1.7 Array Format detected\n';
        } else if (detectedFormat === 'legacy-object') {
          formatInfo = '📦 Legacy v1.7 Object Format detected\n';
        } else if (detectedFormat === 'unified-v1.9') {
          formatInfo = '✨ New v1.9 Unified Format detected\n';
        }

        const confirmMsg = formatInfo +
          `\nImport configuration?\n\n` +
          `Webhooks: ${webhookConfigs.length}\n` +
          `Airtable: ${airtableConfigs.length}\n\n` +
          `⚠️ This will replace your current configuration!`;

        if (!confirm(confirmMsg)) return;

        console.log('📥 [IMPORT] Importing:', {
          format: detectedFormat,
          webhooks: webhookConfigs.length,
          airtable: airtableConfigs.length
        });

        // ✅ FIX: Save to correct storage locations
        await chrome.storage.sync.set({ webhookConfigs: webhookConfigs });
        await chrome.storage.local.set({ airtableConfigs: airtableConfigs });

        // Verify save
        const webhookVerify = await chrome.storage.sync.get(['webhookConfigs']);
        const airtableVerify = await chrome.storage.local.get(['airtableConfigs']);
        
        console.log('✅ [IMPORT] Verification:', {
          webhooks: webhookVerify.webhookConfigs?.length,
          airtable: airtableVerify.airtableConfigs?.length
        });

        // Reload UI
        await this.loadConfigurations();
        
        // Reload Airtable configs
        const airtableManager = await import('./airtableManager.js');
        await airtableManager.airtableManager.loadConfigurations();

        // Reload background worker
        chrome.runtime.reload();

        window.showStatus(
          `Configuration imported successfully (${detectedFormat})`, 
          'success'
        );
      } catch (error) {
        console.error('Import error:', error);
        window.showStatus('Import failed: ' + error.message, 'error');
      }
    };

    input.click();
  }
};
