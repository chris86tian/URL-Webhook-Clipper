/**
 * File Handler Module - Manages file attachments and drag & drop
 */

export const fileHandler = {
  attachments: [],
  maxSize: 10 * 1024 * 1024, // 10MB

  /**
   * Initialize file handling
   */
  init() {
    const dropzone = document.getElementById('dropzone');
    if (!dropzone) return;

    // Make attachments globally accessible for storage module
    window.attachments = this.attachments;
    window.updateFileList = () => this.updateFileList();

    // Drag & Drop events
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
      this.handleFiles(e.dataTransfer.files);
    });

    // Click to select files
    dropzone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.svg';
      input.onchange = (e) => this.handleFiles(e.target.files);
      input.click();
    });
  },

  /**
   * Handle file selection/drop
   */
  handleFiles(files) {
    let currentTotalSize = this.attachments.reduce((sum, file) => sum + (file.data.length * 3 / 4), 0);

    for (const file of files) {
      if (file.size > this.maxSize) {
        this.showStatus(`File ${file.name} exceeds 10MB limit.`, 'error');
        continue;
      }
      if (currentTotalSize + file.size > this.maxSize) {
        this.showStatus(`Adding ${file.name} would exceed total 10MB limit.`, 'error');
        continue;
      }

      currentTotalSize += file.size;

      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment = {
          name: file.name,
          type: file.type,
          data: e.target.result
        };

        if (!this.attachments.some(att => att.name === file.name && att.data === attachment.data)) {
          this.attachments.push(attachment);
          this.updateFileList();
          this.saveToSession();
        } else {
          this.showStatus(`File ${file.name} already added.`, 'info');
        }
      };
      reader.onerror = () => {
        this.showStatus(`Error reading file ${file.name}.`, 'error');
      };
      reader.readAsDataURL(file);
    }
  },

  /**
   * Update file list UI
   */
  updateFileList() {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;

    fileList.innerHTML = this.attachments.map((file, index) => `
      <div class="file-item">
        <span class="file-name" title="${file.name}">${file.name}</span>
        <button class="remove-file" data-index="${index}" aria-label="Remove ${file.name}">×</button>
      </div>
    `).join('');

    // Add remove handlers
    document.querySelectorAll('.remove-file').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        if (!isNaN(index) && index >= 0 && index < this.attachments.length) {
          this.attachments.splice(index, 1);
          this.updateFileList();
          this.saveToSession();
        }
      });
    });
  },

  /**
   * Clear all attachments
   */
  clearAttachments() {
    this.attachments = [];
    window.attachments = [];
    this.updateFileList();
  },

  /**
   * Save attachments to session storage
   */
  async saveToSession() {
    if (typeof window.saveFormDataToSession === 'function') {
      await window.saveFormDataToSession();
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
