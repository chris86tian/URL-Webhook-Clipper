/**
 * Airtable Sender Module - Handles sending data to Airtable
 * V2.0 - FIXED: Empty rows issue + Better logging
 */

import { rateLimiter } from './rateLimiter.js';

export const airtableSender = {
  /**
   * Send data to Airtable
   * @param {Object} config - Airtable configuration
   * @param {Object} payload - Data to send
   * @returns {Promise<Object>} Airtable response
   */
  async send(config, payload) {
    if (!config || !config.token || !config.baseId || !config.tableId) {
      throw new Error('Invalid Airtable configuration. Please check settings.');
    }

    console.log('📊 [AIRTABLE-SEND] Sending to Airtable:', {
      base: config.baseId,
      table: config.tableId,
      name: config.name
    });

    // ✅ FIX: Use payload.record.fields directly (already formatted)
    const fields = payload.record?.fields || {};
    
    console.log('📊 [AIRTABLE-SEND] Fields to send:', {
      fieldCount: Object.keys(fields).length,
      fieldIds: Object.keys(fields),
      fieldValues: fields
    });

    // Use rate limiter
    return await rateLimiter.throttle(config.baseId, async () => {
      return await this.sendToAirtableAPI(config, fields);
    });
  },

  /**
   * Send data to Airtable API
   * @param {Object} config - Airtable configuration
   * @param {Object} fields - Airtable fields
   * @returns {Promise<Object>} API response
   */
  async sendToAirtableAPI(config, fields) {
    const url = `https://api.airtable.com/v0/${config.baseId}/${config.tableId}`;

    const requestBody = {
      records: [{ fields }],
      typecast: true // Enable automatic typecasting
    };

    console.log('🌐 [AIRTABLE-API] Request:', {
      url: url,
      method: 'POST',
      fieldCount: Object.keys(fields).length,
      body: JSON.stringify(requestBody, null, 2)
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      console.log('📡 [AIRTABLE-API] Response:', {
        status: response.status,
        ok: response.ok,
        data: responseData
      });

      if (!response.ok) {
        console.error('❌ [AIRTABLE-API] Error:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData.error
        });

        throw new Error(
          this.getErrorMessage(response.status, responseData.error)
        );
      }

      console.log('✅ [AIRTABLE-API] Success:', responseData);
      return responseData;

    } catch (error) {
      console.error('❌ [AIRTABLE-API] Exception:', error);
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error - check your internet connection');
      }
      throw error;
    }
  },

  /**
   * Get user-friendly error message
   * @param {number} status - HTTP status code
   * @param {Object} error - Airtable error object
   * @returns {string} Error message
   */
  getErrorMessage(status, error) {
    const errorMessage = error?.message || 'Unknown error';

    switch (status) {
      case 401:
        return 'Invalid or expired Personal Access Token.';
      case 403:
        return 'Access denied. Check token permissions.';
      case 404:
        return 'Base or Table not found. Check IDs.';
      case 422:
        return `Invalid field data: ${errorMessage}`;
      case 429:
        return 'Rate limit exceeded. Please wait and try again.';
      default:
        return `Airtable API Error (${status}): ${errorMessage}`;
    }
  }
};
