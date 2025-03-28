document.addEventListener('DOMContentLoaded', function() {
      const notesInput = document.getElementById('notes');
      const sendBtn = document.getElementById('sendBtn');
      const statusDiv = document.getElementById('status');
      const webhookSelect = document.getElementById('webhookSelect');
      const templateSelect = document.getElementById('templateSelect');
      const settingsBtn = document.getElementById('settingsBtn'); // Added settingsBtn selection
      const configDialog = document.getElementById('configDialog');
      const closeConfigBtn = document.getElementById('closeConfigBtn');
      const closePopupBtn = document.getElementById('closePopup'); // Correctly selected
      const addWebhookBtn = document.getElementById('addWebhookBtn');
      const webhookList = document.getElementById('webhookList');
      const dropzone = document.getElementById('dropzone');
      const fileList = document.getElementById('fileList');
      const themeToggle = document.getElementById('themeToggle');
      const importBtn = document.getElementById('importBtn');
      const exportBtn = document.getElementById('exportBtn');

      let attachments = [];
      const templateDescriptionDisplay = document.createElement('div'); // Create a div for template description
      templateDescriptionDisplay.id = 'templateDescription';
      templateDescriptionDisplay.style.marginBottom = '12px'; // Add some margin
      templateDescriptionDisplay.style.fontSize = '12px'; // Smaller font size
      templateDescriptionDisplay.style.color = '#6b7280'; // Gray color
      // Apply dark mode color
      templateDescriptionDisplay.classList.add('text-gray-500', 'dark:text-gray-400');
      document.querySelector('.container').insertBefore(templateDescriptionDisplay, notesInput.parentNode); // Insert before notes input

      // Theme management
      function updateThemeIcon(isDark) {
        themeToggle.innerHTML = isDark
          ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>` // Sun icon
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`; // Moon icon
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
          // Only apply system preference if no user preference is set
          if (result.darkMode === undefined) {
            setTheme(e.matches);
          }
        });
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
        // Consider adding more specific image/document types if needed
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.svg';
        input.onchange = (e) => handleFiles(e.target.files);
        input.click();
      });

      function handleFiles(files) {
        let currentTotalSize = attachments.reduce((sum, file) => sum + (file.data.length * 3 / 4), 0); // Estimate current size
        const maxSize = 10 * 1024 * 1024; // 10MB

        for (const file of files) {
          if (file.size > maxSize) {
            showStatus(`File ${file.name} exceeds 10MB limit.`, 'error');
            continue;
          }
          if (currentTotalSize + file.size > maxSize) {
             showStatus(`Adding ${file.name} would exceed total 10MB limit.`, 'error');
             continue; // Skip this file and subsequent ones if limit is reached
          }

          currentTotalSize += file.size; // Add size for check in next iteration

          const reader = new FileReader();
          reader.onload = function(e) {
            const attachment = {
              name: file.name,
              type: file.type,
              data: e.target.result // Base64 data URL
            };
            // Prevent duplicates
            if (!attachments.some(att => att.name === file.name && att.data === attachment.data)) {
                 attachments.push(attachment);
                 updateFileList();
            } else {
                 showStatus(`File ${file.name} already added.`, 'info'); // Use 'info' for duplicates
            }
          };
           reader.onerror = function() {
              showStatus(`Error reading file ${file.name}.`, 'error');
           };
          reader.readAsDataURL(file);
        }
      }

      function updateFileList() {
        fileList.innerHTML = attachments.map((file, index) => `
          <div class="file-item">
            <span class="file-name dark:text-gray-200" title="${file.name}">${file.name}</span>
            <button class="remove-file" data-index="${index}" aria-label="Remove ${file.name}">×</button>
          </div>
        `).join('');

        // Add click handlers for remove buttons
        document.querySelectorAll('.remove-file').forEach(button => {
          button.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            if (!isNaN(index) && index >= 0 && index < attachments.length) {
                attachments.splice(index, 1);
                updateFileList();
            }
          });
        });
      }

      // Load configurations and populate dropdowns
      loadConfigurations();

      // *** Add Event Listener for the main close button ***
      closePopupBtn.addEventListener('click', function() {
        window.close(); // Closes the extension popup
      });

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

      // Delegate event listener for dynamic elements within webhookList
      webhookList.addEventListener('click', function(event) {
        const target = event.target;
        const webhookItem = target.closest('.webhook-item');
        if (!webhookItem) return;

        const index = Array.from(webhookList.children).indexOf(webhookItem);

        if (target.classList.contains('save-webhook')) {
          saveWebhook(index, webhookItem);
        } else if (target.classList.contains('delete-webhook')) {
          deleteWebhook(index);
        } else if (target.classList.contains('add-template')) {
          addTemplate(index);
        } else if (target.classList.contains('remove-template')) {
          const templateName = target.dataset.template;
          removeTemplate(index, templateName);
        }
      });


      webhookSelect.addEventListener('change', function() {
        updateTemplateOptions();
        updateTemplateDescription(); // Update the description when the webhook changes
      });

      templateSelect.addEventListener('change', function() {
        updateTemplateDescription(); // Update the description when the template changes
      });

      // --- Function to send data to webhook ---
      function sendDataToWebhook(payload) {
        chrome.storage.sync.get(['webhookConfigs'], function(result) {
          const configs = result.webhookConfigs || [];
          const selectedConfig = configs.find(c => c.id === payload.webhookId); // Use ID from payload

          if (!selectedConfig || !selectedConfig.url) {
            showStatus('Selected webhook is invalid or missing URL.', 'error');
            sendBtn.disabled = false; // Re-enable button
            return;
          }

          fetch(selectedConfig.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Add any other headers if needed, e.g., Authorization
            },
            body: JSON.stringify(payload.data) // Send the actual data part
          })
          .then(response => {
            const status = response.status;
            const statusText = response.statusText;
            const isSuccess = response.ok;
            return response.text().then(text => ({ status, statusText, isSuccess, text }));
          })
          .then(({ status, statusText, isSuccess, text }) => {
             let responseToShow = text;
             try {
                const jsonResponse = JSON.parse(text);
                responseToShow = JSON.stringify(jsonResponse, null, 2);
             } catch (e) { /* Ignore parsing error, keep as text */ }

             notesInput.value = `Response Status: ${status} ${statusText}\n\n${responseToShow}`;

             if (isSuccess) {
                showStatus('Successfully sent to webhook!', 'success');
                attachments = []; // Clear attachments on success
                updateFileList();
                // Optionally clear notes on success?
                // notesInput.value = '';
             } else {
                showStatus(`Error: ${status} ${statusText}. Check notes for details.`, 'error');
             }
          })
          .catch(error => {
            console.error('Fetch Error:', error);
            showStatus('Network Error: ' + error.message, 'error');
            notesInput.value = `Fetch Error: ${error.message}\n\nPlease check the webhook URL and your network connection. Ensure CORS is configured correctly on the server if applicable.`;
          })
          .finally(() => {
             sendBtn.disabled = false; // Re-enable button
          });
        });
      }
      // --- End of sendDataToWebhook function ---


      sendBtn.addEventListener('click', function() {
        sendBtn.disabled = true; // Disable button on click
        showStatus('Sending...', 'info'); // Show sending status

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (!tabs || tabs.length === 0 || !tabs[0].id || !tabs[0].url) { // Check tab ID as well
              showStatus('Could not get current tab information.', 'error');
              sendBtn.disabled = false; // Re-enable button
              return;
          }
          const currentTab = tabs[0];
          const currentUrl = currentTab.url;
          const currentTitle = currentTab.title;
          const notes = notesInput.value;
          const selectedWebhookId = webhookSelect.value;
          const selectedTemplateName = templateSelect.value;

          // --- Prepare base payload ---
          const basePayload = {
            url: currentUrl,
            title: currentTitle,
            notes: notes,
            template: selectedTemplateName,
            metaDescription: '', // Default to empty
            timestamp: new Date().toISOString(),
            attachments: attachments // Already base64 encoded
          };

          // --- Check if URL is restricted BEFORE trying to execute script ---
          const isRestrictedUrl = currentUrl.startsWith('chrome://') ||
                                  currentUrl.startsWith('https://chrome.google.com/webstore');

          if (isRestrictedUrl) {
            console.warn("Skipping meta description fetch for restricted URL:", currentUrl);
            showStatus('Sending... (Note: Meta description not available for this page type)', 'info');
            // Send data directly without meta description
            sendDataToWebhook({ webhookId: selectedWebhookId, data: basePayload });

          } else {
            // --- URL is not restricted, attempt to get meta description ---
            chrome.scripting.executeScript({
              target: { tabId: currentTab.id },
              func: () => {
                const metaDesc = document.querySelector('meta[name="description"]');
                return metaDesc ? metaDesc.content : '';
              }
            }, (injectionResults) => {
              let metaDescription = ''; // Keep default empty

              if (chrome.runtime.lastError) {
                // Log error if script injection failed for other reasons
                console.warn("Could not get meta description:", chrome.runtime.lastError.message);
                showStatus('Warning: Could not retrieve meta description. ' + chrome.runtime.lastError.message, 'info');
                // Proceed without meta description even if there was an error
              } else if (injectionResults && injectionResults.length > 0 && injectionResults[0].result) {
                // Successfully got meta description
                metaDescription = injectionResults[0].result;
              }

              // Update payload with potentially retrieved meta description
              basePayload.metaDescription = metaDescription;

              // Send data
              sendDataToWebhook({ webhookId: selectedWebhookId, data: basePayload });
            }); // End of executeScript callback
          } // End of URL check else block
        }); // End of tabs.query callback
      }); // End of sendBtn click listener

      function updateTemplateDescription() {
        const selectedTemplateName = templateSelect.value;
        const selectedWebhookId = webhookSelect.value;

        chrome.storage.sync.get(['webhookConfigs'], function(result) {
          const configs = result.webhookConfigs || [];
          const selectedConfig = configs.find(c => c.id === selectedWebhookId);
          let description = '';

          if (selectedConfig && selectedConfig.templates) {
            const selectedTemplate = selectedConfig.templates.find(t => t.name === selectedTemplateName);
            if (selectedTemplate && selectedTemplate.description) {
              description = selectedTemplate.description;
            }
          }
          templateDescriptionDisplay.textContent = description; // Display the description or clear if none
          templateDescriptionDisplay.style.display = description ? 'block' : 'none'; // Hide if no description
        });
      }

      function loadConfigurations() {
        chrome.storage.sync.get(['webhookConfigs', 'lastSelectedWebhookId', 'lastSelectedTemplateName'], function(result) {
          const configs = result.webhookConfigs || [];
          const lastSelectedWebhookId = result.lastSelectedWebhookId;
          const lastSelectedTemplateName = result.lastSelectedTemplateName;

          webhookSelect.innerHTML = ''; // Clear existing options

          if (configs.length === 0) {
            webhookSelect.innerHTML = '<option value="">No webhooks configured</option>';
            templateSelect.innerHTML = '<option value="">No templates</option>';
            updateTemplateDescription(); // Clear description
            return;
          }

          let foundLastSelectedWebhook = false;
          configs.forEach(config => {
            const option = document.createElement('option');
            option.value = config.id;
            option.textContent = config.label || `Webhook ${config.id}`; // Use label or fallback
            webhookSelect.appendChild(option);
            if (config.id === lastSelectedWebhookId) {
               option.selected = true;
               foundLastSelectedWebhook = true;
            }
          });

          // If the last selected webhook doesn't exist anymore, select the first one
          if (!foundLastSelectedWebhook && webhookSelect.options.length > 0) {
             webhookSelect.options[0].selected = true;
          }

          updateTemplateOptions(lastSelectedTemplateName); // Pass last selected template name
        });
      }

      function updateTemplateOptions(lastSelectedTemplateName = null) {
         const selectedWebhookId = webhookSelect.value;
         chrome.storage.sync.get(['webhookConfigs'], function(result) {
            const configs = result.webhookConfigs || [];
            const selectedConfig = configs.find(c => c.id === selectedWebhookId);

            templateSelect.innerHTML = ''; // Clear existing options

            let foundLastSelectedTemplate = false;
            if (selectedConfig && selectedConfig.templates && selectedConfig.templates.length > 0) {
               selectedConfig.templates.forEach(template => {
                  const option = document.createElement('option');
                  option.value = template.name;
                  option.textContent = template.name;
                  templateSelect.appendChild(option);
                  // Select the last used template for this webhook if available
                  if (template.name === lastSelectedTemplateName) {
                     option.selected = true;
                     foundLastSelectedTemplate = true;
                  }
               });
            }

            if (templateSelect.options.length === 0) {
               templateSelect.innerHTML = '<option value="">No templates</option>';
            } else if (!foundLastSelectedTemplate) {
               // If last selected wasn't found (or wasn't provided), select the first template
               templateSelect.options[0].selected = true;
            }

            // Save the currently selected options for next time
            chrome.storage.sync.set({
               lastSelectedWebhookId: selectedWebhookId,
               lastSelectedTemplateName: templateSelect.value
            });

            updateTemplateDescription(); // Update description based on the (potentially newly) selected template
         });
      }


      function renderWebhookList() {
        chrome.storage.sync.get(['webhookConfigs'], function(result) {
          const configs = result.webhookConfigs || [];
          webhookList.innerHTML = ''; // Clear current list

          if (configs.length === 0) {
             webhookList.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400">No webhooks configured yet. Click "+ Add New Webhook" to start.</p>';
             return;
          }

          configs.forEach((config, index) => {
            const webhookItem = document.createElement('div');
            webhookItem.className = 'webhook-item';
            webhookItem.dataset.index = index; // Store index for easier access

            // Generate HTML for templates
            const templatesHtml = (config.templates || []).map(template => `
              <div class="template-entry" style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                <span class="template-tag">${template.name}</span>
                <input type="text" class="template-description" value="${template.description || ''}" placeholder="Description" style="flex-grow: 1; font-size: 12px; padding: 2px 4px;">
                <button class="remove-template" data-template="${template.name}" aria-label="Remove template ${template.name}" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0 4px; font-size: 16px;">×</button>
              </div>
            `).join('');

            webhookItem.innerHTML = `
              <div style="margin-bottom: 8px;">
                <label for="webhook-label-${index}" style="display: block; font-size: 14px; margin-bottom: 2px;">Label:</label>
                <input type="text" id="webhook-label-${index}" class="webhook-label" value="${config.label || ''}" placeholder="e.g., Make Workflow">
              </div>
              <div style="margin-bottom: 8px;">
                <label for="webhook-url-${index}" style="display: block; font-size: 14px; margin-bottom: 2px;">URL:</label>
                <input type="url" id="webhook-url-${index}" class="webhook-url" value="${config.url || ''}" placeholder="https://hook.example.com/...">
              </div>
              <div style="margin-bottom: 8px;">
                <label style="display: block; font-size: 14px; margin-bottom: 4px;">Templates:</label>
                <div class="template-list" style="display: flex; flex-direction: column; gap: 4px;">
                  ${templatesHtml}
                </div>
                <button class="add-template" style="margin-top: 8px; font-size: 12px; padding: 4px 8px;">+ Add Template</button>
              </div>
              <div class="action-buttons" style="margin-top: 12px;">
                <button class="save-webhook">Save</button>
                <button class="delete-btn delete-webhook">Delete</button>
              </div>
            `;
            webhookList.appendChild(webhookItem);
          });
        });
      }

      function addTemplate(index) {
        const templateName = prompt("Enter new template name:");
        if (templateName && templateName.trim() !== '') {
          chrome.storage.sync.get(['webhookConfigs'], function(result) {
            const configs = result.webhookConfigs || [];
            if (index >= 0 && index < configs.length) {
              // Ensure templates array exists
              if (!configs[index].templates) {
                configs[index].templates = [];
              }
              // Check if template name already exists
              if (configs[index].templates.some(t => t.name === templateName.trim())) {
                 alert(`Template "${templateName.trim()}" already exists for this webhook.`);
                 return;
              }
              const newTemplate = {
                name: templateName.trim(),
                description: '' // Start with empty description
              };
              configs[index].templates.push(newTemplate);
              chrome.storage.sync.set({ webhookConfigs: configs }, function() {
                renderWebhookList(); // Re-render to show the new template input
                // No need to update main dropdowns here, only config view changed
              });
            }
          });
        } else if (templateName !== null) { // Only show error if prompt wasn't cancelled
           alert("Template name cannot be empty.");
        }
      }

      function addNewWebhook() {
        chrome.storage.sync.get(['webhookConfigs'], function(result) {
          const configs = result.webhookConfigs || [];
          // Find the highest existing number to avoid collisions if items were deleted
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
            label: `Webhook ${maxIdNum + 1}`, // Default label
            url: '',
            templates: []
          };
          configs.push(newWebhook);
          chrome.storage.sync.set({ webhookConfigs: configs }, function() {
            renderWebhookList(); // Re-render config list
            loadConfigurations(); // Update main dropdowns
          });
        });
      }

      function saveWebhook(index, webhookItemElement) {
         const newLabel = webhookItemElement.querySelector('.webhook-label').value.trim();
         const newUrl = webhookItemElement.querySelector('.webhook-url').value.trim();

         if (!newUrl) {
            alert("Webhook URL cannot be empty.");
            return;
         }
         // Basic URL validation (doesn't guarantee correctness but catches common errors)
         try {
            new URL(newUrl);
         } catch (_) {
            alert("Invalid Webhook URL format.");
            return;
         }

         chrome.storage.sync.get(['webhookConfigs'], function(result) {
            const configs = result.webhookConfigs || [];
            if (index >= 0 && index < configs.length) {
               configs[index].label = newLabel || `Webhook ${configs[index].id}`; // Use ID if label is empty
               configs[index].url = newUrl;

               // Save template names and descriptions
               const templateEntries = webhookItemElement.querySelectorAll('.template-entry');
               const updatedTemplates = [];
               let duplicateFound = false;
               const templateNames = new Set();

               templateEntries.forEach(entry => {
                  const name = entry.querySelector('.template-tag')?.textContent; // Get name from tag
                  const description = entry.querySelector('.template-description').value.trim();
                  if (name) {
                     if (templateNames.has(name)) {
                        duplicateFound = true;
                     }
                     templateNames.add(name);
                     updatedTemplates.push({ name, description });
                  }
               });

               if (duplicateFound) {
                  // This shouldn't happen if removal works correctly, but as a safeguard
                  alert("Duplicate template names found. Please ensure names are unique.");
                  return;
               }

               configs[index].templates = updatedTemplates;

               chrome.storage.sync.set({ webhookConfigs: configs }, function() {
                  showStatus('Webhook saved!', 'success');
                  loadConfigurations(); // Reload main dropdowns to reflect changes
                  // Optionally re-render the list if IDs/order could change, but not necessary here
                  // renderWebhookList();
               });
            }
         });
      }


      function deleteWebhook(index) {
        if (confirm('Are you sure you want to delete this webhook? This cannot be undone.')) {
          chrome.storage.sync.get(['webhookConfigs'], function(result) {
            const configs = result.webhookConfigs || [];
            if (index >= 0 && index < configs.length) {
              configs.splice(index, 1); // Remove the webhook at the specified index
              chrome.storage.sync.set({ webhookConfigs: configs }, function() {
                showStatus('Webhook deleted.', 'success');
                renderWebhookList(); // Re-render the configuration list
                loadConfigurations(); // Reload the main dropdowns
              });
            }
          });
        }
      }

      function removeTemplate(webhookIndex, templateName) {
         // No confirmation needed as it's easily re-added
         chrome.storage.sync.get(['webhookConfigs'], function(result) {
            const configs = result.webhookConfigs || [];
            if (webhookIndex >= 0 && webhookIndex < configs.length) {
               const webhook = configs[webhookIndex];
               if (webhook.templates) {
                  webhook.templates = webhook.templates.filter(t => t.name !== templateName);
                  chrome.storage.sync.set({ webhookConfigs: configs }, function() {
                     renderWebhookList(); // Re-render config list to reflect removal
                     // No need to update main dropdowns immediately, will happen on next load/change
                  });
               }
            }
         });
      }


      function showStatus(message, type = 'info') { // Default type to 'info'
        statusDiv.textContent = message;
        // Remove existing type classes
        statusDiv.classList.remove('success', 'error', 'info');
        // Add the new type class if it's success or error
        if (type === 'success' || type === 'error') {
            statusDiv.classList.add(type);
        } else {
            statusDiv.classList.add('info'); // Add info class for styling
        }
        statusDiv.style.display = 'block';

        // Clear status after a few seconds, unless it's an error
        if (type !== 'error') {
            setTimeout(() => {
               // Check if the message is still the same before hiding
               if (statusDiv.textContent === message) {
                   statusDiv.style.display = 'none';
                   statusDiv.textContent = '';
                   statusDiv.classList.remove('success', 'error', 'info');
               }
            }, 5000); // Hide after 5 seconds
        }
      }

      // Export webhooks to JSON
      exportBtn.addEventListener('click', function() {
        chrome.storage.sync.get(['webhookConfigs'], function(result) {
          const configs = result.webhookConfigs || [];
          if (configs.length === 0) {
             showStatus("No webhooks to export.", "info");
             return;
          }
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configs, null, 2)); // Pretty print JSON
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute("download", "webhook_clipper_configs.json"); // More specific filename
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
          showStatus("Webhook configurations exported.", "success");
        });
      });

      // Import webhooks from JSON
      importBtn.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json'; // Accept .json and json mime type
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
              try {
                const importedData = JSON.parse(event.target.result);
                // Basic validation: Check if it's an array
                if (Array.isArray(importedData)) {
                   // Optional: More thorough validation of each object's structure
                   const isValid = importedData.every(item =>
                       typeof item === 'object' && item !== null && 'id' in item && 'url' in item // Check for essential fields
                       // Add more checks if needed (e.g., templates structure)
                   );

                   if (isValid) {
                      // Ask user if they want to replace or merge (optional, replace is simpler)
                      if (confirm("Importing will replace all current webhook configurations. Continue?")) {
                         chrome.storage.sync.set({ webhookConfigs: importedData }, function() {
                            showStatus('Webhooks imported successfully!', 'success');
                            renderWebhookList();
                            loadConfigurations();
                         });
                      }
                   } else {
                      throw new Error('Invalid data structure in JSON file. Each webhook must have at least "id" and "url".');
                   }
                } else {
                  throw new Error('Invalid JSON format: Expected an array of webhooks.');
                }
              } catch (error) {
                console.error("Import Error:", error);
                showStatus('Import failed: ' + error.message, 'error');
              }
            };
            reader.onerror = function() {
               showStatus('Error reading file.', 'error');
            };
            reader.readAsText(file);
          }
        };
        input.click();
      });

    }); // End DOMContentLoaded
