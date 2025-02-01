document.addEventListener('DOMContentLoaded', function() {
  const notesInput = document.getElementById('notes');
  const sendBtn = document.getElementById('sendBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const statusDiv = document.getElementById('status');
  const webhookSelect = document.getElementById('webhookSelect');
  const templateSelect = document.getElementById('templateSelect');
  const configDialog = document.getElementById('configDialog');
  const closeConfigBtn = document.getElementById('closeConfigBtn');
  const addWebhookBtn = document.getElementById('addWebhookBtn');
  const webhookList = document.getElementById('webhookList');

  // Load configurations and populate dropdowns
  loadConfigurations();

  settingsBtn.addEventListener('click', function() {
    configDialog.classList.add('active');
    renderWebhookList();
  });

  closeConfigBtn.addEventListener('click', function() {
    configDialog.classList.remove('active');
  });

  addWebhookBtn.addEventListener('click', function() {
    addNewWebhook();
  });

  webhookSelect.addEventListener('change', function() {
    updateTemplateOptions();
  });

  sendBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0].url;
      const currentTitle = tabs[0].title;
      const notes = notesInput.value;
      const selectedWebhookId = webhookSelect.value;
      const selectedTemplate = templateSelect.value;

      chrome.storage.sync.get(['webhookConfigs'], function(result) {
        const configs = result.webhookConfigs || [];
        const selectedConfig = configs.find(c => c.id === selectedWebhookId);

        if (!selectedConfig) {
          showStatus('Please configure webhook first', 'error');
          return;
        }

        const payload = {
          url: currentUrl,
          title: currentTitle,
          notes: notes,
          template: selectedTemplate,
          timestamp: new Date().toISOString()
        };

        fetch(selectedConfig.url, {
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
          showStatus('Successfully sent to webhook!', 'success');
          notesInput.value = '';
        })
        .catch(error => {
          showStatus('Error sending to webhook: ' + error.message, 'error');
        });
      });
    });
  });

  function loadConfigurations() {
    chrome.storage.sync.get(['webhookConfigs'], function(result) {
      const configs = result.webhookConfigs || [];
      
      // Clear existing options
      webhookSelect.innerHTML = '';
      
      if (configs.length === 0) {
        webhookSelect.innerHTML = '<option value="">No webhooks configured</option>';
        return;
      }

      configs.forEach(config => {
        const option = document.createElement('option');
        option.value = config.id;
        option.textContent = config.label;
        webhookSelect.appendChild(option);
      });

      updateTemplateOptions();
    });
  }

  function updateTemplateOptions() {
    chrome.storage.sync.get(['webhookConfigs'], function(result) {
      const configs = result.webhookConfigs || [];
      const selectedConfig = configs.find(c => c.id === webhookSelect.value);
      
      templateSelect.innerHTML = '';
      
      if (selectedConfig && selectedConfig.templates) {
        selectedConfig.templates.forEach(template => {
          const option = document.createElement('option');
          option.value = template;
          option.textContent = template;
          templateSelect.appendChild(option);
        });
      } else {
        templateSelect.innerHTML = '<option value="">No templates available</option>';
      }
    });
  }

  function renderWebhookList() {
    chrome.storage.sync.get(['webhookConfigs'], function(result) {
      const configs = result.webhookConfigs || [];
      webhookList.innerHTML = '';

      configs.forEach((config, index) => {
        const webhookItem = document.createElement('div');
        webhookItem.className = 'webhook-item';
        webhookItem.innerHTML = `
          <div>
            <label>Label:</label>
            <input type="text" class="webhook-label" value="${config.label}" data-id="${config.id}">
          </div>
          <div>
            <label>URL:</label>
            <input type="url" class="webhook-url" value="${config.url}">
          </div>
          <div>
            <label>Templates:</label>
            <div class="template-list">
              ${config.templates.map(template => `
                <span class="template-tag">
                  ${template}
                  <button class="remove-template" data-template="${template}">×</button>
                </span>
              `).join('')}
              <button class="add-template">+ Add Template</button>
            </div>
          </div>
          <div class="action-buttons">
            <button class="save-webhook">Save</button>
            <button class="delete-btn delete-webhook">Delete</button>
          </div>
        `;

        // Add event listeners
        const saveBtn = webhookItem.querySelector('.save-webhook');
        const deleteBtn = webhookItem.querySelector('.delete-webhook');
        const addTemplateBtn = webhookItem.querySelector('.add-template');
        const removeTemplateBtns = webhookItem.querySelectorAll('.remove-template');

        saveBtn.addEventListener('click', () => saveWebhook(index));
        deleteBtn.addEventListener('click', () => deleteWebhook(index));
        addTemplateBtn.addEventListener('click', () => addTemplate(index));
        removeTemplateBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            const template = e.target.dataset.template;
            removeTemplate(index, template);
          });
        });

        webhookList.appendChild(webhookItem);
      });
    });
  }

  function addNewWebhook() {
    chrome.storage.sync.get(['webhookConfigs'], function(result) {
      const configs = result.webhookConfigs || [];
      const newWebhook = {
        id: 'webhook' + (configs.length + 1),
        label: 'New Webhook',
        url: '',
        templates: []
      };
      configs.push(newWebhook);
      chrome.storage.sync.set({ webhookConfigs: configs }, function() {
        renderWebhookList();
        loadConfigurations();
      });
    });
  }

  function saveWebhook(index) {
    chrome.storage.sync.get(['webhookConfigs'], function(result) {
      const configs = result.webhookConfigs || [];
      const webhookItem = webhookList.children[index];
      
      configs[index].label = webhookItem.querySelector('.webhook-label').value;
      configs[index].url = webhookItem.querySelector('.webhook-url').value;

      chrome.storage.sync.set({ webhookConfigs: configs }, function() {
        showStatus('Webhook saved!', 'success');
        loadConfigurations();
      });
    });
  }

  function deleteWebhook(index) {
    if (confirm('Are you sure you want to delete this webhook?')) {
      chrome.storage.sync.get(['webhookConfigs'], function(result) {
        const configs = result.webhookConfigs || [];
        configs.splice(index, 1);
        chrome.storage.sync.set({ webhookConfigs: configs }, function() {
          renderWebhookList();
          loadConfigurations();
        });
      });
    }
  }

  function addTemplate(index) {
    const template = prompt('Enter template name:');
    if (template) {
      chrome.storage.sync.get(['webhookConfigs'], function(result) {
        const configs = result.webhookConfigs || [];
        if (!configs[index].templates.includes(template)) {
          configs[index].templates.push(template);
          chrome.storage.sync.set({ webhookConfigs: configs }, function() {
            renderWebhookList();
            updateTemplateOptions();
          });
        }
      });
    }
  }

  function removeTemplate(index, template) {
    chrome.storage.sync.get(['webhookConfigs'], function(result) {
      const configs = result.webhookConfigs || [];
      configs[index].templates = configs[index].templates.filter(t => t !== template);
      chrome.storage.sync.set({ webhookConfigs: configs }, function() {
        renderWebhookList();
        updateTemplateOptions();
      });
    });
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
    statusDiv.style.display = 'block';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
});