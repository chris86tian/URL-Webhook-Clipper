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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

🚀 Free German Community: Boost your Business Community mit KI: https://www.skool.com/boostyourbusiness/about

⭐️ 1:1 Zoom - Call with Christian: https://calendly.com/christiangoetz/60min

📲 My Agency Lipa LIFE: https://lipalife.de

🎤 My first Songs on Spotify: https://open.spotify.com/intl-de/artist/4rUKEiC2c4Cr7vVc8F7JbZ

📸 Instagram: Some photos of me an my family/ christian_ _goetz

You are happy with this and it safe your time:
Send me a coffee: https://www.paypal.com/donate?business=chris86tian@gmail.com&currency_code=EUR

## Acknowledgments

- Inspired by the Airtable Web Clipper
- Built with vanilla JavaScript and Chrome Extension APIs
