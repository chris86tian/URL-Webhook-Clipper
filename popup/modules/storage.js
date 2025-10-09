/**
 * Storage Module - KONZEPT A Compatible
 * Version 5.0 - Unified destination storage
 */

export const storage = {
  /**
   * Initialize storage migration
   */
  async initializeMigration() {
    try {
      console.log('🔄 [MIGRATION] Starting migration check...');
      const localData = await chrome.storage.local.get(null);
      
      const { airtableConfigs, webhookConfigs, ...dataToMigrate } = localData;
      
      if (Object.keys(dataToMigrate).length > 0) {
        console.log('🔄 [MIGRATION] Migrating data to session storage...');
        await chrome.storage.session.set(dataToMigrate);
        
        const keysToRemove = Object.keys(dataToMigrate);
        if (keysToRemove.length > 0) {
          await chrome.storage.local.remove(keysToRemove);
        }
        
        console.log('✅ [MIGRATION] Migration complete');
      }
    } catch (error) {
      console.error('❌ [MIGRATION] Migration error:', error);
    }
  },

  /**
   * Save general form data
   */
  async saveGeneralFormData(formData) {
    try {
      await chrome.storage.session.set({ generalFormData: formData });
      console.log('💾 [STORAGE] Saved general form data');
    } catch (error) {
      console.error('❌ [STORAGE] Error saving general form data:', error);
    }
  },

  /**
   * Load general form data
   */
  async loadGeneralFormData() {
    try {
      const result = await chrome.storage.session.get(['generalFormData']);
      return result.generalFormData || null;
    } catch (error) {
      console.error('❌ [STORAGE] Error loading general form data:', error);
      return null;
    }
  },

  /**
   * Save Airtable table-specific data
   */
  async saveAirtableTableData(baseId, tableId, formData) {
    if (!baseId || !tableId) return;
    try {
      const key = `formData_${baseId}_${tableId}`;
      await chrome.storage.session.set({ [key]: formData });
      console.log('💾 [STORAGE] Saved Airtable table data:', key);
    } catch (error) {
      console.error('❌ [STORAGE] Error saving Airtable table data:', error);
    }
  },

  /**
   * Load Airtable table-specific data
   */
  async loadAirtableTableData(baseId, tableId) {
    if (!baseId || !tableId) return null;
    try {
      const key = `formData_${baseId}_${tableId}`;
      const result = await chrome.storage.session.get([key]);
      return result[key] || null;
    } catch (error) {
      console.error('❌ [STORAGE] Error loading Airtable table data:', error);
      return null;
    }
  },

  /**
   * Clear Airtable table-specific data
   */
  async clearAirtableTableData(baseId, tableId) {
    if (!baseId || !tableId) return;
    try {
      const key = `formData_${baseId}_${tableId}`;
      await chrome.storage.session.remove([key]);
      console.log('🗑️ [STORAGE] Cleared Airtable table data:', key);
    } catch (error) {
      console.error('❌ [STORAGE] Error clearing Airtable table data:', error);
    }
  },

  /**
   * Get Airtable form state from UI
   */
  getAirtableFormState() {
    const state = {
      notes: '',
      customFields: {}
    };
    
    document.querySelectorAll('#airtableFieldMappings [data-airtable-field-id]').forEach(el => {
      if (el.readOnly) return;
      
      const fieldId = el.dataset.airtableFieldId;
      let value;

      if (el.type === 'checkbox') {
        value = el.checked;
      } else if (el.tagName === 'SELECT' && el.multiple) {
        value = Array.from(el.selectedOptions).map(opt => opt.value);
      } else {
        value = el.value;
      }

      if (el.id === 'airtable-field-notes') {
        state.notes = value;
      } else {
        state.customFields[fieldId] = value;
      }
    });
    
    return state;
  },

  /**
   * Restore form data based on destination
   */
  async restoreFormData(destinationId) {
    const formData = await this.loadGeneralFormData();
    if (!formData || formData.destinationId !== destinationId) return;
    
    if (formData.destinationType === 'webhook') {
      if (formData.notes) {
        document.getElementById('notes').value = formData.notes;
      }
      if (formData.selectedTemplate) {
        document.getElementById('templateSelect').value = formData.selectedTemplate;
      }
    } else if (formData.destinationType === 'airtable') {
      if (formData.selectedTableId) {
        document.getElementById('airtableTableSelect').value = formData.selectedTableId;
      }
    }
  },

  /**
   * Restore Airtable table data
   */
  async restoreAirtableTableData(baseId, tableId) {
    const formData = await this.loadAirtableTableData(baseId, tableId);
    if (!formData) return;

    if (formData.notes) {
      const notesField = document.getElementById('airtable-field-notes');
      if (notesField) notesField.value = formData.notes;
    }

    if (formData.customFields) {
      Object.entries(formData.customFields).forEach(([fieldId, value]) => {
        const el = document.querySelector(`[data-airtable-field-id="${fieldId}"]`);
        if (!el) return;

        if (el.type === 'checkbox') {
          el.checked = value;
        } else if (el.tagName === 'SELECT' && el.multiple) {
          Array.from(el.options).forEach(opt => {
            opt.selected = value.includes(opt.value);
          });
        } else {
          el.value = value;
        }
      });
    }
  }
};
