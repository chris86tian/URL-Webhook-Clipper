# URL Webhook Clipper

A Chrome extension for clipping URLs, notes, and files to webhooks with session-based persistence.

## Version 1.7 - Latest Updates

### 🎉 New in Version 1.7
- ✅ **Complete Modular Architecture**: Refactored into clean, maintainable modules
- ✅ **Session-Based Persistence**: Form data persists during browser session
- ✅ **Auto-Save Functionality**: Automatic saving with 500ms debounce
- ✅ **Clear Form Button**: Manual reset option for form data
- ✅ **Improved Code Organization**: Separated concerns across 6 specialized modules
- ✅ **Enhanced Developer Experience**: Better maintainability and extensibility

## Features

- 📋 **Clip URLs**: Capture current tab URL and title
- 📝 **Add Notes**: Include custom notes with your clips
- 📎 **Attach Files**: Drag & drop or select files (up to 10MB)
- 🎨 **Dark Mode**: Automatic theme switching
- 💾 **Session Persistence**: Form data persists during browser session
- 🔄 **Multiple Webhooks**: Configure multiple webhook destinations
- 🏷️ **Templates**: Organize clips with custom templates
- 📤 **Import/Export**: Backup and restore webhook configurations
- 🧹 **Clear Form**: Manual reset button for quick cleanup

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Usage

### Basic Workflow

1. Click the extension icon to open the popup
2. Select a webhook destination and template
3. Add notes (optional)
4. Attach files (optional)
5. Click "Send to Webhook"

### Session Persistence (New in v1.7)

- **Auto-Save**: Form data automatically saves as you type (500ms debounce)
- **Persistent Fields**: Notes, webhook selection, template selection, and attachments
- **Session-Only**: Data persists only during browser session (clears on browser restart)
- **Auto-Clear**: Data automatically clears after successful send or on error
- **Manual Clear**: Use "Clear Form" button to reset all fields
- **Dynamic URL**: Current tab URL is always fetched fresh at send time (never stored)

### Webhook Configuration

1. Click "⚙️ Configure" to open settings
2. Add new webhooks with labels and URLs
3. Create templates for each webhook
4. Add descriptions to templates for context
5. Save configurations

### Import/Export

- **Export**: Backup your webhook configurations to JSON
- **Import**: Restore configurations from JSON file

## File Structure

```
URL-Webhook-Clipper/
├── manifest.json           # Extension manifest (v1.7)
├── background.js          # Background service worker
├── popup/
│   ├── popup.html        # Main popup UI
│   ├── popup.js          # Main orchestration script
│   ├── styles.css        # All styles
│   └── modules/          # Modular architecture (NEW in v1.7)
│       ├── storage.js    # Session storage management
│       ├── theme.js      # Dark mode handling
│       ├── fileHandler.js # File attachment logic
│       ├── sender.js     # Webhook sending logic
│       └── webhookManager.js # Webhook CRUD operations
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Technical Details

### Storage Architecture (v1.7)

- **Session Storage** (`chrome.storage.session`): 
  - Form data (notes, selections, attachments)
  - Temporary, clears on browser restart
  - Auto-saves with debouncing
  
- **Sync Storage** (`chrome.storage.sync`):
  - Webhook configurations
  - Theme preference
  - Persistent across browser sessions

### Permissions

- `activeTab`: Access current tab information
- `storage`: Store configurations and session data
- `scripting`: Extract meta descriptions from pages
- `contextMenus`: Right-click menu integration
- `notifications`: User notifications

### Supported File Types

- Documents: PDF, DOC, DOCX, XLS, XLSX, TXT
- Images: JPG, JPEG, PNG, GIF, WEBP, SVG

## Development

### Module Structure (New in v1.7)

Each module is self-contained and exports its functionality:

- **storage.js**: Handles all session storage operations
  - Save/load/clear form data
  - Get current form state
  - Restore form state to UI

- **theme.js**: Manages dark mode state and UI
  - Initialize theme based on preference
  - Toggle theme
  - Update theme icons

- **fileHandler.js**: Processes file attachments
  - Drag & drop handling
  - File validation
  - Attachment management

- **sender.js**: Sends data to webhooks
  - Fetch current tab info
  - Prepare payload
  - Handle webhook responses

- **webhookManager.js**: Manages webhook configurations
  - CRUD operations for webhooks
  - Template management
  - Import/export functionality

### Adding New Features

1. Create a new module in `popup/modules/`
2. Export functions from the module
3. Import and initialize in `popup.js`
4. Add UI elements to `popup.html`
5. Style in `styles.css`

### Key Design Patterns

- **ES6 Modules**: Clean imports/exports with `type="module"`
- **Dependency Injection**: Modules communicate through main orchestrator
- **Separation of Concerns**: Each module handles one responsibility
- **Debouncing**: Auto-save with 500ms delay to prevent excessive writes

## Changelog

### Version 1.7 (Current)
- 🎉 Complete modular refactoring
- ✅ Session-based persistence implementation
- ✅ Auto-save with debouncing
- ✅ Clear Form button added
- ✅ Improved code organization
- ✅ Enhanced maintainability

### Version 1.6
- ✅ CORS fix for webhook requests
- ✅ Webhook response handling in notes field
- ✅ Template descriptions
- ✅ Layout improvements

### Version 1.5
- ✅ AI Agent integration support
- ✅ Enhanced webhook response display
- ✅ Template description feature

### Version 1.4
- ✅ Phone number to smartphone feature
- ✅ Context menu integration

### Version 1.3
- ✅ Dark mode improvements
- ✅ Import/Export functionality
- ✅ Template visibility enhancements

### Version 1.2
- ✅ Persistent popup window
- ✅ Drag & drop file support
- ✅ GDPR compliance documentation

## License

MIT License - See LICENSE file for details

## Credits

Design by [Lipa LIFE](https://www.lipalife.de)

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/chris86tian/URL-Webhook-Clipper/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/chris86tian/URL-Webhook-Clipper/discussions)
- 📧 **Contact**: [Lipa LIFE](https://www.lipalife.de)
