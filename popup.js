document.addEventListener('DOMContentLoaded', function() {
  const notesInput = document.getElementById('notes');
  const sendBtn = document.getElementById('sendBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const statusDiv = document.getElementById('status');
  const webhookSelect = document.getElementById('webhookSelect');
  const templateSelect = document.getElementById('templateSelect');
  const configDialog = document.getElementById('configDialog');
  const closeConfigBtn = document.getElementById('closeConfigBtn');
  const closePopupBtn = document.getElementById('closePopup');
  const addWebhookBtn = document.getElementById('addWebhookBtn');
  const webhookList = document.getElementById('webhookList');
  const dropzone = document.getElementById('dropzone');
  const fileList = document.getElementById('fileList');
  const themeToggle = document.getElementById('themeToggle');

  let attachments = [];
  
  // Theme management
  function updateThemeIcon(isDark) {
    themeToggle.innerHTML = isDark 
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  }

  function setTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    updateThemeIcon(isDark);
    chrome.storage.sync.set({ darkMode: isDark });
  }

  // Initialize theme
  chrome.storage.sync.get(['darkMode'], function(result) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = result.darkMode ?? prefersDark;
    setTheme(isDark);
  });

  // Theme toggle click handler
  themeToggle.addEventListener('click', function() {
    const isDark = !document.body.classList.contains('dark-mode');
    setTheme(isDark);
  });

  // System theme change handler
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    chrome.storage.sync.get(['darkMode'], function(result) {
      if (result.darkMode === undefined) {
        setTheme(e.matches);
      }
    });
  });

  // Close popup button
  closePopupBtn.addEventListener('click', function() {
    window.close();
  });

  // Drag & Drop Event Listeners
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  dropzone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png';
    input.onchange = (e) => handleFiles(e.target.files);
    input.click();
  });

  function handleFiles(files) {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showStatus(`File ${file.name} is too large. Maximum size is 10MB.`, 'error');
        continue;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        const attachment = {
          name: file.name,
          type: file.type,
          data: e.target.result
        };
        attachments.push(attachment);
        updateFileList();
      };
      reader.readAsDataURL(file);
    }
  }

  function updateFileList() {
    fileList.innerHTML = attachments.map((file, index) => `
      <div class="file-item">
        <span class="file-name">${file.name}</span>
        <button class="remove-file" data-index="${index}">×</button>
      </div>
    `).join('');

    // Add click handlers for remove buttons
    document.querySelectorAll('.remove-file').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        attachments.splice(index, 1);
        updateFileList();
      });
    });
  }

  // Add version checking and data migration
  function checkAndMigrateData() {
    chrome.storage.sync.get(['webhookConfigs', 'dataVersion'], function(result) {
      const currentVersion = '1.2'; // Updated version
      const storedVersion = result.dataVersion;
      const configs = result.webhookConfigs || [];

      if (!storedVersion) {
        // First time setup or old version without versioning
        chrome.storage.sync.set({ 
          dataVersion: currentVersion,
          webhookConfigs: configs 
        });
      } else if (storedVersion !== currentVersion) {
        // Perform data migration based on version differences
        let migratedConfigs = migrateData(configs, storedVersion, currentVersion);
        chrome.storage.sync.set({ 
          dataVersion: currentVersion,
          webhookConfigs: migratedConfigs 
        });
      }
    });
  }

  function migrateData(configs, fromVersion, toVersion) {
    // Handle different version migrations
    switch(fromVersion) {
      case '0.9':
        // Example migration from version 0.9 to 1.0
        configs = configs.map(config => {
          if (!config.templates) {
            config.templates = [];
          }
          return config;
        });
        break;
      case '1.0':
      case '1.1':
        // No changes needed for data structure in 1.2
        break;
    }
    return configs;
  }

  // Call migration check on startup
  checkAndMigrateData();

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
          timestamp: new Date().toISOString(),
          attachments: attachments
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
          attachments = [];
          updateFileList();
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
  }
});
