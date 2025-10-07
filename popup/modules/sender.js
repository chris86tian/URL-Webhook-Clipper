/**
 * Sender Module - Handles webhook sending logic
 */

export const sender = {
  /**
   * Send data to webhook
   */
  async send() {
    const sendBtn = document.getElementById('sendBtn');
    const notesInput = document.getElementById('notes');
    const webhookSelect = document.getElementById('webhookSelect');
    const templateSelect = document.getElementById('templateSelect');

    if (!sendBtn || !notesInput || !webhookSelect || !templateSelect) return;

    sendBtn.disabled = true;
    this.showStatus('Sending...', 'info');

    try {
      // Get current tab info
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tabs || tabs.length === 0 || !tabs[0].id || !tabs[0].url) {
        throw new Error('Could not get current tab information.');
      }

      const currentTab = tabs[0];
      const currentUrl = currentTab.url;
      const currentTitle = currentTab.title;
      const notes = notesInput.value;
      const selectedWebhookId = webhookSelect.value;
      const selectedTemplateName = templateSelect.value;

      // Prepare base payload
      const basePayload = {
        url: currentUrl,
        title: currentTitle,
        notes: notes,
        template: selectedTemplateName,
        metaDescription: '',
        timestamp: new Date().toISOString(),
        attachments: window.attachments || []
      };

      // Check if URL is restricted
      const isRestrictedUrl = currentUrl.startsWith('chrome://') ||
                              currentUrl.startsWith('https://chrome.google.com/webstore');

      if (isRestrictedUrl) {
        console.warn("Skipping meta description fetch for restricted URL:", currentUrl);
        await this.sendToWebhook(selectedWebhookId, basePayload);
      } else {
        // Try to get meta description
        try {
          const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: () => {
              const metaDesc = document.querySelector('meta[name="description"]');
              return metaDesc ? metaDesc.content : '';
            }
          });

          if (injectionResults && injectionResults.length > 0 && injectionResults[0].result) {
            basePayload.metaDescription = injectionResults[0].result;
          }
        } catch (error) {
          console.warn("Could not get meta description:", error.message);
        }

        await this.sendToWebhook(selectedWebhookId, basePayload);
      }
    } catch (error) {
      console.error('Send Error:', error);
      this.showStatus('Error: ' + error.message, 'error');
      sendBtn.disabled = false;
    }
  },

  /**
   * Send payload to webhook URL
   */
  async sendToWebhook(webhookId, payload) {
    const sendBtn = document.getElementById('sendBtn');
    const notesInput = document.getElementById('notes');

    try {
      const result = await chrome.storage.sync.get(['webhookConfigs']);
      const configs = result.webhookConfigs || [];
      const selectedConfig = configs.find(c => c.id === webhookId);

      if (!selectedConfig || !selectedConfig.url) {
        throw new Error('Selected webhook is invalid or missing URL.');
      }

      const response = await fetch(selectedConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const status = response.status;
      const statusText = response.statusText;
      const isSuccess = response.ok;
      const text = await response.text();

      let responseToShow = text;
      try {
        const jsonResponse = JSON.parse(text);
        responseToShow = JSON.stringify(jsonResponse, null, 2);
      } catch (e) {
        // Keep as text if not JSON
      }

      notesInput.value = `Response Status: ${status} ${statusText}\n\n${responseToShow}`;

      if (isSuccess) {
        this.showStatus('Successfully sent to webhook!', 'success');
        // ✅ Removed automatic clearFormData() - form only clears manually via Clear button
      } else {
        throw new Error(`${status} ${statusText}. Check notes for details.`);
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      this.showStatus('Network Error: ' + error.message, 'error');
      notesInput.value = `Fetch Error: ${error.message}\n\nPlease check the webhook URL and your network connection.`;
      // ✅ Removed automatic clearFormData() on error
      throw error;
    } finally {
      sendBtn.disabled = false;
    }
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
