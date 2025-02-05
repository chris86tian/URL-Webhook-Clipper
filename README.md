# URL Webhook Clipper

A Chrome extension that allows you to easily send URLs and custom notes to multiple webhook endpoints. Perfect for saving links to your favorite services or creating tasks from web pages.

[Deutsche Version (German Version)](README.de.md)

## Video Tutorial
[![URL Webhook Clipper Tutorial](https://img.youtube.com/vi/Cwjrm6HHJ-s/0.jpg)](https://www.youtube.com/watch?v=Cwjrm6HHJ-s)

## Features

- 🔗 Send current tab URL to any configured webhook
- 📝 Add custom notes to your submissions
- ⚡ Support for multiple webhook endpoints
- 🏷️ Customizable templates for each webhook
- 📎 Drag & drop files from Chrome's download popup directly into the extension
- 🔄 Persistent popup window for better workflow
- 🌓 Dark mode support with system preference detection
- 🔒 Secure storage of webhook configurations
- 🎨 Clean and intuitive user interface

## Installation

### From Chrome Web Store
https://chromewebstore.google.com/detail/url-webhook-clipper/akgfjejofhfldfhijdmndomkcimfngac

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
5. Drag & drop files directly from Chrome's download popup or your computer
6. Click "Send to Webhook" to submit

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
  "timestamp": "2024-03-13T20:00:00.000Z",
  "attachments": [
    {
      "name": "filename.pdf",
      "type": "application/pdf",
      "data": "base64-encoded-content"
    }
  ]
}
```

## Data Privacy (GDPR/DSGVO)

The URL Webhook Clipper extension is designed with privacy in mind and complies with GDPR requirements:

### Data Collection and Usage
- The extension only collects data that you explicitly provide:
  - URLs and titles of web pages you choose to share
  - Notes you enter manually
  - Files you choose to attach
  - Webhook configurations you set up
- All data is stored locally in your browser
- Data is only sent to the webhook endpoints you configure
- No analytics or tracking is implemented
- No data is shared with third parties

### Your Rights Under GDPR
- Right to access: All your data is stored locally in your browser
- Right to erasure: You can remove all data by:
  - Deleting webhook configurations
  - Clearing browser storage
  - Uninstalling the extension
- Right to data portability: Webhook configurations can be exported
- Right to information: This documentation provides full transparency about data handling

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

## Support

Need help? Found a bug? Have a feature request? Please visit our [GitHub repository](https://github.com/chris86tian/URL-Webhook-Clipper) to:
- Report issues
- Request features
- Contribute to the project
- Get the latest updates

## Changelog

### Version 1.3
- Improved dark mode readability in the Configure view
- Enhanced template button visibility in dark mode

### Version 1.2
- Added persistent popup window
- Added close button (X) in the top right corner
- Added drag & drop support for files from Chrome's download popup
- Added GitHub support link
- Improved status message visibility
- Enhanced drag & drop visual feedback
- Added GDPR compliance documentation
- Added German translation

### Version 1.1
- Initial release with basic functionality
- Multiple webhook support
- Template system
- File attachment support

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

👋 **Christian Götz**  

📢 **Boost Your Business Community** – The free German community for Business & AI:  
➡️ [Join here](https://www.skool.com/boostyourbusiness/about)  

🛠 **1:1 Zoom Call with Christian** – Need help with automations?  
📅 [Book a session](https://calendly.com/christiangoetz/60min)  

🚀 **My Agency Lipa LIFE** – Digital Marketing & Automation:  
🌐 [Website](https://lipalife.de)  

🎤 **My first German AI songs on Spotify** – Where AI meets music:  
🎵 [Listen now](https://open.spotify.com/intl-de/artist/4rUKEiC2c4Cr7vVc8F7JbZ)  

📸 **Instagram** – A glimpse into my life & family:  
📷 [@christian_ _goetz](https://www.instagram.com/christian__goetz/)  

☕ **Is this tool saving you time?**  
Support me with a coffee:  
💰 [Donate via PayPal](https://www.paypal.com/donate?business=chris86tian@gmail.com&currency_code=EUR)  

## Acknowledgments

- Inspired by the Airtable Web Clipper
- Built with vanilla JavaScript and Chrome Extension APIs
