/**
 * Theme Module - Handles dark mode toggle and persistence
 */

export const theme = {
  /**
   * Initialize theme based on stored preference or system preference
   */
  async init() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    // Load saved theme preference
    const result = await chrome.storage.sync.get(['darkMode']);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = result.darkMode ?? prefersDark;
    
    this.setTheme(isDark);

    // Add click handler
    themeToggle.addEventListener('click', () => {
      const isDark = !document.body.classList.contains('dark-mode');
      this.setTheme(isDark);
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async (e) => {
      const result = await chrome.storage.sync.get(['darkMode']);
      if (result.darkMode === undefined) {
        this.setTheme(e.matches);
      }
    });
  },

  /**
   * Set theme and update UI
   */
  setTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    this.updateThemeIcon(isDark);
    chrome.storage.sync.set({ darkMode: isDark });
  },

  /**
   * Update theme toggle icon
   */
  updateThemeIcon(isDark) {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    themeToggle.innerHTML = isDark
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  }
};
