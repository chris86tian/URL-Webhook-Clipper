# URL Webhook Clipper

A Chrome extension for clipping URLs, notes, and files to webhooks and Airtable with right-click context menu support.

## Version 2.0 - Latest Updates

### 🎉 New in Version 2.0
- ✅ **Right-Click Context Menu**: Send content directly from any webpage via context menu
- ✅ **Unified Destination Dropdown**: Single dropdown for both Webhooks and Airtable
- ✅ **Clean Vertical Field Layout**: Apple-style form design with perfect alignment
- ✅ **Airtable Integration**: Full support for Airtable bases and tables
- ✅ **Dynamic Field Rendering**: Automatic field detection and mapping
- ✅ **Improved UX**: Streamlined interface with better visual hierarchy
- ✅ **Enhanced Error Handling**: Clear, contextual error messages
- ✅ **Session Persistence**: Form data persists during browser session

### 🔥 Version 2.0 Highlights

#### **Context Menu Integration**
- Right-click on any page, link, image, or selected text
- Choose destination from organized submenu (Webhooks / Airtable)
- Automatic payload creation with URL, title, and selection
- Success/error notifications
- Works seamlessly with both Webhook and Airtable destinations

#### **Unified Destination Management**
- Single dropdown for all destinations (Webhooks + Airtable tables)
- Visual grouping with optgroups
- Icons for destination types (🔗 Webhooks, 📊 Airtable)
- Dynamic field rendering based on selection

#### **Apple-Style Design**
- Clean vertical field alignment
- Generous spacing and padding
- Smooth transitions and focus states
- Professional, modern interface

## Features

### Core Functionality
- 📋 **Clip URLs**: Capture current tab URL and title
- 📝 **Add Notes**: Include custom notes with your clips
- 📎 **Attach Files**: Drag & drop or select files (up to 10MB)
- 🖱️ **Right-Click Menu**: Send content directly from context menu
- 🎨 **Dark Mode**: Automatic theme switching
- 💾 **Session Persistence**: Form data persists during browser session

### Webhook Support
- 🔄 **Multiple Webhooks**: Configure multiple webhook destinations
- 🏷️ **Templates**: Organize clips with custom templates
- 📤 **Import/Export**: Backup and restore webhook configurations
- ✅ **Test Connection**: Verify webhook URLs before sending

### Airtable Integration
- 📊 **Multiple Bases**: Connect to multiple Airtable bases
- 🗂️ **Table Selection**: Choose specific tables within bases
- 🔧 **Field Mapping**: Map extension fields to Airtable fields
- 🎯 **Dynamic Fields**: Automatic field type detection
- 👥 **Collaborator Support**: Select users from dropdown
- ✅ **Validation**: Ensure all required fields are configured

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Usage

### Basic Workflow

1. Click the extension icon to open the popup
2. Select a destination (Webhook or Airtable table)
3. Add notes (optional)
4. Attach files (optional)
5. Click "Send to Webhook/Airtable"

### Context Menu Workflow (New in v2.0)

1. Right-click on any page, link, image, or selected text
2. Hover over "Send to Webhook/Airtable"
3. Choose your destination from the submenu
4. Content is sent automatically
5. Receive success/error notification

### Session Persistence

- **Auto-Save**: Form data automatically saves as you type (500ms debounce)
- **Persistent Fields**: Notes, destination selection, and attachments
- **Session-Only**: Data persists only during browser session (clears on browser restart)
- **Auto-Clear**: Data automatically clears after successful send or on error
- **Manual Clear**: Use "Clear Form" button to reset all fields
- **Dynamic URL**: Current tab URL is always fetched fresh at send time

### Webhook Configuration

1. Click "⚙️ Configure" to open settings
2. Navigate to "Webhooks" tab
3. Add new webhooks with labels and URLs
4. Create templates for each webhook
5. Add descriptions to templates for context
6. Test connection before saving
7. Save configurations

### Airtable Configuration

1. Click "⚙️ Configure" to open settings
2. Navigate to "Airtable" tab
3. Add new Airtable base:
   - Enter base name
   - Paste Personal Access Token
   - Enter Base ID
4. Click "Fetch Tables" to load available tables
5. For each table:
   - Click "Configure Fields"
   - Map URL and Title fields (required)
   - Select additional fields to show in popup
   - Save configuration
6. Test connection before saving

### Import/Export

- **Export**: Backup your webhook configurations to JSON
- **Import**: Restore configurations from JSON file

## File Structure

```
URL-Webhook-Clipper/
├── manifest.json           # Extension manifest (v2.0)
├── background.js          # Background service worker with context menu
├── popup/
│   ├── popup.html        # Main popup UI
│   ├── popup.js          # Main orchestration script
│   ├── styles.css        # All styles (Apple-style design)
│   └── modules/          # Modular architecture
│       ├── storage.js    # Session storage management
│       ├── theme.js      # Dark mode handling
│       ├── fileHandler.js # File attachment logic
│       ├── sender.js     # Webhook/Airtable sending logic
│       ├── webhookManager.js # Webhook CRUD operations
│       ├── airtableManager.js # Airtable CRUD operations
│       └── airtableSender.js # Airtable API integration
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Technical Details

### Storage Architecture

- **Session Storage** (`chrome.storage.session`): 
  - Form data (notes, selections, attachments)
  - Temporary, clears on browser restart
  - Auto-saves with debouncing
  
- **Sync Storage** (`chrome.storage.sync`):
  - Webhook configurations
  - Theme preference
  - Persistent across browser sessions

- **Local Storage** (`chrome.storage.local`):
  - Airtable configurations (tokens, base IDs)
  - Field mappings and table schemas
  - Persistent across browser sessions

### Context Menu Architecture (New in v2.0)

- **Dynamic Menu Building**: Context menu updates automatically when destinations change
- **Grouped Destinations**: Webhooks and Airtable tables organized in submenus
- **Smart Payload Creation**: Automatically extracts URL, title, selection, and meta description
- **Error Handling**: Shows notifications for success/failure
- **Storage Monitoring**: Listens for config changes and rebuilds menu

### Permissions

- `activeTab`: Access current tab information
- `storage`: Store configurations and session data
- `scripting`: Extract meta descriptions from pages
- `contextMenus`: Right-click menu integration
- `notifications`: User notifications

### Supported File Types

- Documents: PDF, DOC, DOCX, XLS, XLSX, TXT
- Images: JPG, JPEG, PNG, GIF, WEBP, SVG

### Airtable Field Types Supported

- ✅ Single Line Text
- ✅ Long Text
- ✅ Number
- ✅ Date
- ✅ Date & Time
- ✅ Checkbox
- ✅ Single Select
- ✅ Multiple Select
- ✅ Single Collaborator
- ✅ Multiple Collaborators
- ✅ URL
- ✅ Email
- ✅ Phone Number

## Development

### Module Structure

Each module is self-contained and exports its functionality:

- **storage.js**: Handles all session storage operations
- **theme.js**: Manages dark mode state and UI
- **fileHandler.js**: Processes file attachments
- **sender.js**: Sends data to webhooks and Airtable
- **webhookManager.js**: Manages webhook configurations
- **airtableManager.js**: Manages Airtable configurations
- **airtableSender.js**: Handles Airtable API communication

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
- **Event-Driven**: Context menu and storage listeners for real-time updates

## Changelog

### Version 2.0 (Current)
- 🎉 **Right-click context menu** for Webhooks and Airtable
- ✅ **Unified destination dropdown** with visual grouping
- ✅ **Clean vertical field layout** (Apple-style)
- ✅ **Full Airtable integration** with dynamic field mapping
- ✅ **Improved error handling** with contextual messages
- ✅ **Enhanced UX** with better visual hierarchy
- ✅ **Session persistence** for form data
- ✅ **Automatic context menu updates** when configs change

### Version 1.9
- ✅ Airtable base-centric architecture
- ✅ Dynamic field rendering
- ✅ Collaborator support
- ✅ Field validation

### Version 1.8
- ✅ Modular refactoring
- ✅ Improved code organization

### Version 1.7
- ✅ Session-based persistence
- ✅ Auto-save with debouncing
- ✅ Clear Form button

### Version 1.6
- ✅ CORS fix for webhook requests
- ✅ Template descriptions

### Version 1.5
- ✅ AI Agent integration support
- ✅ Enhanced webhook response display

### Version 1.4
- ✅ Phone number to smartphone feature
- ✅ Context menu integration (initial)

### Version 1.3
- ✅ Dark mode improvements
- ✅ Import/Export functionality

### Version 1.2
- ✅ Persistent popup window
- ✅ Drag & drop file support

## Known Limitations

- Airtable attachments require Base64 → URL conversion (planned for future release)
- Maximum 10MB file size for attachments
- Context menu limited to 6 items per submenu (Chrome limitation)
- Airtable API rate limit: 5 requests/second

## Roadmap

### Planned Features
- 📎 Airtable attachment upload (Base64 → URL)
- 🔍 Search/filter for destinations (when 10+ destinations)
- 📊 Analytics and statistics
- 🔄 Batch operations
- ⚡ Two-phase lazy loading optimization
- 🛡️ Field validation
- 🔁 Error recovery with automatic retry
- 💾 Schema caching (24h)

## License

MIT License - See LICENSE file for details

## Credits

Design by [Lipa LIFE](https://www.lipalife.de)

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/chris86tian/URL-Webhook-Clipper/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/chris86tian/URL-Webhook-Clipper/discussions)
- 📧 **Contact**: [Lipa LIFE](https://www.lipalife.de)

---

**Version 2.0** - Built with ❤️ for productivity enthusiasts
