/**
 * Rate Limiter Module - Handles Airtable API rate limiting
 * Airtable limit: 5 requests per second per base
 */

export class AirtableRateLimiter {
  constructor() {
    // Map of baseId -> array of request timestamps
    this.queues = new Map();
    this.maxRequestsPerSecond = 5;
    this.windowMs = 1000;
  }

  /**
   * Throttle a function call to respect rate limits
   * @param {string} baseId - Airtable base ID
   * @param {Function} fn - Async function to execute
   * @returns {Promise} Result of the function
   */
  async throttle(baseId, fn) {
    if (!this.queues.has(baseId)) {
      this.queues.set(baseId, []);
    }

    const queue = this.queues.get(baseId);
    const now = Date.now();

    // Remove timestamps older than 1 second
    const recentRequests = queue.filter(timestamp => now - timestamp < this.windowMs);
    this.queues.set(baseId, recentRequests);

    // If we've hit the limit, wait
    if (recentRequests.length >= this.maxRequestsPerSecond) {
      const oldestRequest = recentRequests[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 10; // +10ms buffer
      
      console.log(`⏳ Rate limit reached for base ${baseId}, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Add current request timestamp
    queue.push(Date.now());

    // Execute the function
    try {
      return await fn();
    } catch (error) {
      // Remove the timestamp if request failed
      const index = queue.indexOf(Date.now());
      if (index > -1) {
        queue.splice(index, 1);
      }
      throw error;
    }
  }

  /**
   * Clear rate limit queue for a specific base
   * @param {string} baseId - Airtable base ID
   */
  clearQueue(baseId) {
    this.queues.delete(baseId);
  }

  /**
   * Clear all rate limit queues
   */
  clearAllQueues() {
    this.queues.clear();
  }

  /**
   * Get current queue status for a base
   * @param {string} baseId - Airtable base ID
   * @returns {Object} Queue status
   */
  getQueueStatus(baseId) {
    const queue = this.queues.get(baseId) || [];
    const now = Date.now();
    const recentRequests = queue.filter(timestamp => now - timestamp < this.windowMs);
    
    return {
      requestsInLastSecond: recentRequests.length,
      remainingCapacity: this.maxRequestsPerSecond - recentRequests.length,
      canSendImmediately: recentRequests.length < this.maxRequestsPerSecond
    };
  }
}

// Global rate limiter instance
export const rateLimiter = new AirtableRateLimiter();
