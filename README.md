# URL Webhook Clipper

A Chrome extension that allows you to easily send URLs and custom notes to multiple webhook endpoints. Perfect for saving links to your favorite services or creating tasks from web pages.

## Features

- 🔗 Send current tab URL to any configured webhook
- 📝 Add custom notes to your submissions
- ⚡ Support for multiple webhook endpoints
- 🏷️ Customizable templates for each webhook
- 🔒 Secure storage of webhook configurations
- 🎨 Clean and intuitive user interface

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar
2. Select the desired webhook destination from the dropdown
3. Choose a template (if configured)
4. Add any additional notes
5. Click "Send to Webhook" to submit

### Configuration

1. Click the ⚙️ icon to open the configuration panel
2. Add new webhooks with the "+ Add New Webhook" button
3. For each webhook, configure:
   - Label: A friendly name for the webhook
   - URL: The webhook endpoint
   - Templates: Predefined categories or types for your submissions

## Webhook Payload Format

The extension sends data in the following JSON format:

```json
{
  "url": "https://example.com",
  "title": "Page Title",
  "notes": "User entered notes",
  "template": "Selected template",
  "timestamp": "2024-03-13T20:00:00.000Z"
}
```

## Development

### Prerequisites
- Chrome browser
- Basic understanding of JavaScript and Chrome extension development

### Project Structure
```
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json
├── popup.html
├── popup.js
└── README.md
```

### Building
No build step required. The extension can be loaded directly into Chrome in developer mode.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Christian Götz

🚀 Free German Community: Boost your Business Community mit KI: https://www.skool.com/boostyourbusine...

⭐️ 1:1 Zoom - Call with Christian: https://calendly.com/christiangoetz/6... 

📲 Lipa LIFE Agentur Webseite: https://lipalife.de

🎤 Mein erster Song auf Spotify: https://open.spotify.com/intl-de/arti...

📸 Instagram:  Fotos von mir / christian_ _goetz

## Acknowledgments

- Inspired by the Airtable Web Clipper
- Built with vanilla JavaScript and Chrome Extension APIs
