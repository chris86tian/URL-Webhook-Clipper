/**
 * Webhook Manager Module - Handles webhook configuration CRUD operations
 */

export const webhookManager = {
  /**
   * Initialize webhook manager
   */
  init() {
    const settingsBtn = document.getElementById('settingsBtn');
    const closeConfigBtn = document.getElementById('closeConfigBtn');
    const addWebhookBtn = document.getElementById('addWebhookBtn');
    const configDialog = document.getElementById('configDialog');
    const webhookList = document.getElementById('webhookList');
    const importBtn = document.getElementById('importBtn');
    const exportBtn = document.getElementById('exportBtn');

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        configDialog?.classList.add('active');
        this.renderWebhookList();
      });
    }

    if (closeConfigBtn) {
      closeConfigBtn.addEventListener('click', () => {
        configDialog?.classList.remove('active');
      });
    }

    if (addWebhookBtn) {
      addWebhookBtn.addEventListener('click', () => this.addNewWebhook());
    }

    if (webhookList) {
      webhookList.addEventListener('click', (event) => {
        const target = event.target;
        const webhookItem = target.closest('.webhook-item');
        if (!webhookItem) return;

        const index = Array.from(webhookList.children).indexOf(webhookItem);

        if (target.classList.contains('save-webhook')) {
          this.saveWebhook(index, webhookItem);
        } else if (target.classList.contains('delete-webhook')) {
          this.deleteWebhook(index);
        } else if (target.classList.contains('add-template')) {
          this.addTemplate(index);
        } else if (target.classList.contains('remove-template')) {
          const templateName = target.dataset.template;
          this.removeTemplate(index, templateName);
        }
      });
    }

    if (importBtn) {
      importBtn.addEventListener('click', () => this.importWebhooks());
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportWebhooks());
    }
  },

  /**
   * Load webhook configurations
   */
  async loadConfigurations() {
    const result = await chrome.storage.sync.get(['webhookConfigs', 'lastSelectedWebhookId', 'lastSelectedTemplateName']);
    const configs = result.webhookConfigs || [];
    const lastSelectedWebhookId = result.lastSelectedWebhookId;
    const lastSelectedTemplateName = result.lastSelectedTemplateName;

    const webhookSelect = document.getElementById('webhookSelect');
    if (!webhookSelect) return;

    webhookSelect.innerHTML = '';

    if (configs.length === 0) {
      webhookSelect.innerHTML = '<option value="">No webhooks configured</option>';
      const templateSelect = document.getElementById('templateSelect');
      if (templateSelect) {
        templateSelect.innerHTML = '<option value="">No templates</option>';
      }
      this.updateTemplateDescription();
      return;
    }

    let foundLastSelectedWebhook = false;
    configs.forEach(config => {
      const option = document.createElement('option');
      option.value = config.id;
      option.textContent = config.label || `Webhook ${config.id}`;
      webhookSelect.appendChild(option);
      if (config.id === lastSelectedWebhookId) {
        option.selected = true;
        foundLastSelectedWebhook = true;
      }
    });

    if (!foundLastSelectedWebhook && webhookSelect.options.length > 0) {
      webhookSelect.options[0].selected = true;
    }

    this.updateTemplateOptions(lastSelectedTemplateName);
  },

  /**
   * Update template options based on selected webhook
   */
  async updateTemplateOptions(lastSelectedTemplateName = null) {
    const webhookSelect = document.getElementById('webhookSelect');
    const templateSelect = document.getElementById('templateSelect');
    if (!webhookSelect || !templateSelect) return;

    const selectedWebhookId = webhookSelect.value;
    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];
    const selectedConfig = configs.find(c => c.id === selectedWebhookId);

    templateSelect.innerHTML = '';

    let foundLastSelectedTemplate = false;
    if (selectedConfig && selectedConfig.templates && selectedConfig.templates.length > 0) {
      selectedConfig.templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.name;
        option.textContent = template.name;
        templateSelect.appendChild(option);
        if (template.name === lastSelectedTemplateName) {
          option.selected = true;
          foundLastSelectedTemplate = true;
        }
      });
    }

    if (templateSelect.options.length === 0) {
      templateSelect.innerHTML = '<option value="">No templates</option>';
    } else if (!foundLastSelectedTemplate) {
      templateSelect.options[0].selected = true;
    }

    await chrome.storage.sync.set({
      lastSelectedWebhookId: selectedWebhookId,
      lastSelectedTemplateName: templateSelect.value
    });

    this.updateTemplateDescription();
  },

  /**
   * Update template description display
   */
  async updateTemplateDescription() {
    const webhookSelect = document.getElementById('webhookSelect');
    const templateSelect = document.getElementById('templateSelect');
    const templateDescription = document.getElementById('templateDescription');
    
    if (!webhookSelect || !templateSelect || !templateDescription) return;

    const selectedTemplateName = templateSelect.value;
    const selectedWebhookId = webhookSelect.value;

    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];
    const selectedConfig = configs.find(c => c.id === selectedWebhookId);
    let description = '';

    if (selectedConfig && selectedConfig.templates) {
      const selectedTemplate = selectedConfig.templates.find(t => t.name === selectedTemplateName);
      if (selectedTemplate && selectedTemplate.description) {
        description = selectedTemplate.description;
      }
    }

    templateDescription.textContent = description;
    templateDescription.style.display = description ? 'block' : 'none';
  },

  /**
   * Render webhook list in config dialog
   */
  async renderWebhookList() {
    const webhookList = document.getElementById('webhookList');
    if (!webhookList) return;

    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];

    webhookList.innerHTML = '';

    if (configs.length === 0) {
      webhookList.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400">No webhooks configured yet. Click "+ Add New Webhook" to start.</p>';
      return;
    }

    configs.forEach((config, index) => {
      const webhookItem = document.createElement('div');
      webhookItem.className = 'webhook-item';
      webhookItem.dataset.index = index;

      const templatesHtml = (config.templates || []).map(template => `
        <div class="template-entry">
          <span class="template-tag">${template.name}</span>
          <input type="text" class="template-description" value="${template.description || ''}" placeholder="Description">
          <button class="remove-template" data-template="${template.name}" aria-label="Remove template ${template.name}">×</button>
        </div>
      `).join('');

      webhookItem.innerHTML = `
        <div style="margin-bottom: 8px;">
          <label for="webhook-label-${index}">Label:</label>
          <input type="text" id="webhook-label-${index}" class="webhook-label" value="${config.label || ''}" placeholder="e.g., Make Workflow">
        </div>
        <div style="margin-bottom: 8px;">
          <label for="webhook-url-${index}">URL:</label>
          <input type="url" id="webhook-url-${index}" class="webhook-url" value="${config.url || ''}" placeholder="https://hook.example.com/...">
        </div>
        <div style="margin-bottom: 8px;">
          <label>Templates:</label>
          <div class="template-list">
            ${templatesHtml}
          </div>
          <button class="add-template">+ Add Template</button>
        </div>
        <div class="action-buttons">
          <button class="save-webhook">Save</button>
          <button class="delete-btn delete-webhook">Delete</button>
        </div>
      `;
      webhookList.appendChild(webhookItem);
    });
  },

  /**
   * Add new webhook
   */
  async addNewWebhook() {
    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];
    
    let maxIdNum = 0;
    configs.forEach(c => {
      if (c.id && c.id.startsWith('webhook')) {
        const num = parseInt(c.id.substring(7));
        if (!isNaN(num) && num > maxIdNum) {
          maxIdNum = num;
        }
      }
    });
    const newId = 'webhook' + (maxIdNum + 1);

    const newWebhook = {
      id: newId,
      label: `Webhook ${maxIdNum + 1}`,
      url: '',
      templates: []
    };
    configs.push(newWebhook);
    
    await chrome.storage.sync.set({ webhookConfigs: configs });
    this.renderWebhookList();
    this.loadConfigurations();
  },

  /**
   * Save webhook configuration
   */
  async saveWebhook(index, webhookItemElement) {
    const newLabel = webhookItemElement.querySelector('.webhook-label').value.trim();
    const newUrl = webhookItemElement.querySelector('.webhook-url').value.trim();

    if (!newUrl) {
      alert("Webhook URL cannot be empty.");
      return;
    }

    try {
      new URL(newUrl);
    } catch (_) {
      alert("Invalid Webhook URL format.");
      return;
    }

    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];
    
    if (index >= 0 && index < configs.length) {
      configs[index].label = newLabel || `Webhook ${configs[index].id}`;
      configs[index].url = newUrl;

      const templateEntries = webhookItemElement.querySelectorAll('.template-entry');
      const updatedTemplates = [];
      const templateNames = new Set();

      templateEntries.forEach(entry => {
        const name = entry.querySelector('.template-tag')?.textContent;
        const description = entry.querySelector('.template-description').value.trim();
        if (name) {
          if (templateNames.has(name)) {
            alert("Duplicate template names found. Please ensure names are unique.");
            return;
          }
          templateNames.add(name);
          updatedTemplates.push({ name, description });
        }
      });

      configs[index].templates = updatedTemplates;

      await chrome.storage.sync.set({ webhookConfigs: configs });
      this.showStatus('Webhook saved!', 'success');
      this.loadConfigurations();
    }
  },

  /**
   * Delete webhook
   */
  async deleteWebhook(index) {
    if (!confirm('Are you sure you want to delete this webhook? This cannot be undone.')) {
      return;
    }

    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];
    
    if (index >= 0 && index < configs.length) {
      configs.splice(index, 1);
      await chrome.storage.sync.set({ webhookConfigs: configs });
      this.showStatus('Webhook deleted.', 'success');
      this.renderWebhookList();
      this.loadConfigurations();
    }
  },

  /**
   * Add template to webhook
   */
  async addTemplate(index) {
    const templateName = prompt("Enter new template name:");
    if (!templateName || templateName.trim() === '') {
      if (templateName !== null) {
        alert("Template name cannot be empty.");
      }
      return;
    }

    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];
    
    if (index >= 0 && index < configs.length) {
      if (!configs[index].templates) {
        configs[index].templates = [];
      }
      if (configs[index].templates.some(t => t.name === templateName.trim())) {
        alert(`Template "${templateName.trim()}" already exists for this webhook.`);
        return;
      }
      
      const newTemplate = {
        name: templateName.trim(),
        description: ''
      };
      configs[index].templates.push(newTemplate);
      
      await chrome.storage.sync.set({ webhookConfigs: configs });
      this.renderWebhookList();
    }
  },

  /**
   * Remove template from webhook
   */
  async removeTemplate(webhookIndex, templateName) {
    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];
    
    if (webhookIndex >= 0 && webhookIndex < configs.length) {
      const webhook = configs[webhookIndex];
      if (webhook.templates) {
        webhook.templates = webhook.templates.filter(t => t.name !== templateName);
        await chrome.storage.sync.set({ webhookConfigs: configs });
        this.renderWebhookList();
      }
    }
  },

  /**
   * Export webhooks to JSON
   */
  async exportWebhooks() {
    const result = await chrome.storage.sync.get(['webhookConfigs']);
    const configs = result.webhookConfigs || [];
    
    if (configs.length === 0) {
      this.showStatus("No webhooks to export.", "info");
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "webhook_clipper_configs.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    this.showStatus("Webhook configurations exported.", "success");
  },

  /**
   * Import webhooks from JSON
   */
  importWebhooks() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          
          if (!Array.isArray(importedData)) {
            throw new Error('Invalid JSON format: Expected an array of webhooks.');
          }

          const isValid = importedData.every(item =>
            typeof item === 'object' && item !== null && 'id' in item && 'url' in item
          );

          if (!isValid) {
            throw new Error('Invalid data structure in JSON file. Each webhook must have at least "id" and "url".');
          }

          if (confirm("Importing will replace all current webhook configurations. Continue?")) {
            await chrome.storage.sync.set({ webhookConfigs: importedData });
            this.showStatus('Webhooks imported successfully!', 'success');
            this.renderWebhookList();
            this.loadConfigurations();
          }
        } catch (error) {
          console.error("Import Error:", error);
          this.showStatus('Import failed: ' + error.message, 'error');
        }
      };
      reader.onerror = () => {
        this.showStatus('Error reading file.', 'error');
      };
      reader.readAsText(file);
    };
    input.click();
  },

  /**
   * Show status message
   */
  showStatus(message, type) {
    if (typeof window.showStatus === 'function') {
      window.showStatus(message, type);
    }
  }
};
