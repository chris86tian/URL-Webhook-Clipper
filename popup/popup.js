/**
 * Main Popup Script - Orchestrates all modules
 */

import { storage } from './modules/storage.js';
import { theme } from './modules/theme.js';
import { fileHandler } from './modules/fileHandler.js';
import { sender } from './modules/sender.js';
import { webhookManager } from './modules/webhookManager.js';

// Global state
let isInitialized = false;

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
 * Save form data to session storage
 */
async function saveFormDataToSession() {
  const formData = storage.getCurrentFormState();
  await storage.saveFormData(formData);
}

/**
 * Clear form data
 */
async function clearFormData() {
  // Clear UI
  const notesInput = document.getElementById('notes');
  if (notesInput) notesInput.value = '';
  
  fileHandler.clearAttachments();
  
  // Clear session storage
  await storage.clearFormData();
  
  showStatus('Form cleared', 'info');
}

/**
 * Initialize the popup
 */
async function initializePopup() {
  if (isInitialized) return;
  isInitialized = true;

  // Make functions globally accessible
  window.showStatus = showStatus;
  window.saveFormDataToSession = saveFormDataToSession;
  window.clearFormData = clearFormData;

  // Initialize all modules
  await theme.init();
  fileHandler.init();
  webhookManager.init();

  // Load webhook configurations
  await webhookManager.loadConfigurations();

  // Restore form data from session storage
  const savedFormData = await storage.loadFormData();
  if (savedFormData) {
    storage.restoreFormState(savedFormData);
  }

  // Setup event listeners
  setupEventListeners();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  const sendBtn = document.getElementById('sendBtn');
  const clearBtn = document.getElementById('clearBtn');
  const closePopupBtn = document.getElementById('closePopup');
  const webhookSelect = document.getElementById('webhookSelect');
  const templateSelect = document.getElementById('templateSelect');
  const notesInput = document.getElementById('notes');

  // Send button
  if (sendBtn) {
    sendBtn.addEventListener('click', () => sender.send());
  }

  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (confirm('Clear all form data?')) {
        await clearFormData();
      }
    });
  }

  // Close popup button
  if (closePopupBtn) {
    closePopupBtn.addEventListener('click', () => window.close());
  }

  // Webhook selection change
  if (webhookSelect) {
    webhookSelect.addEventListener('change', async () => {
      await webhookManager.updateTemplateOptions();
      await saveFormDataToSession();
    });
  }

  // Template selection change
  if (templateSelect) {
    templateSelect.addEventListener('change', async () => {
      webhookManager.updateTemplateDescription();
      await saveFormDataToSession();
    });
  }

  // Notes input change
  if (notesInput) {
    let saveTimeout;
    notesInput.addEventListener('input', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => saveFormDataToSession(), 500);
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializePopup);
