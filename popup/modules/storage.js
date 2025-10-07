/**
 * Storage Module - Handles session-based form data persistence
 * Uses chrome.storage.session for temporary storage during browser session
 */

const STORAGE_KEY = 'formData';

export const storage = {
  /**
   * Save form data to session storage
   */
  async saveFormData(data) {
    try {
      await chrome.storage.session.set({ [STORAGE_KEY]: data });
      console.log('Form data saved to session storage');
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  },

  /**
   * Load form data from session storage
   */
  async loadFormData() {
    try {
      const result = await chrome.storage.session.get(STORAGE_KEY);
      return result[STORAGE_KEY] || null;
    } catch (error) {
      console.error('Error loading form data:', error);
      return null;
    }
  },

  /**
   * Clear form data from session storage
   */
  async clearFormData() {
    try {
      await chrome.storage.session.remove(STORAGE_KEY);
      console.log('Form data cleared from session storage');
    } catch (error) {
      console.error('Error clearing form data:', error);
    }
  },

  /**
   * Get current form state from UI
   */
  getCurrentFormState() {
    return {
      notes: document.getElementById('notes')?.value || '',
      selectedWebhookId: document.getElementById('webhookSelect')?.value || '',
      selectedTemplateName: document.getElementById('templateSelect')?.value || '',
      attachments: window.attachments || []
    };
  },

  /**
   * Restore form state to UI
   */
  restoreFormState(formData) {
    if (!formData) return;

    const notesInput = document.getElementById('notes');
    const webhookSelect = document.getElementById('webhookSelect');
    const templateSelect = document.getElementById('templateSelect');

    if (notesInput && formData.notes) {
      notesInput.value = formData.notes;
    }

    if (webhookSelect && formData.selectedWebhookId) {
      webhookSelect.value = formData.selectedWebhookId;
    }

    if (templateSelect && formData.selectedTemplateName) {
      templateSelect.value = formData.selectedTemplateName;
    }

    if (formData.attachments && Array.isArray(formData.attachments)) {
      window.attachments = formData.attachments;
      // Trigger file list update if the function exists
      if (typeof window.updateFileList === 'function') {
        window.updateFileList();
      }
    }
  }
};
