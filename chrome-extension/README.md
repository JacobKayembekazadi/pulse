# NEXUS Chrome Extension

AI-powered social engagement assistant for B2B sales teams.

## Features

- **LinkedIn Integration**: Inject "Reply with NEXUS" buttons into LinkedIn posts
- **Twitter/X Integration**: Generate AI replies directly from tweets
- **Reddit Integration**: Smart replies for Reddit posts and comments
- **AI Reply Generation**: Uses Gemini AI to generate contextual, tone-appropriate replies
- **Multiple Tones**: Professional, Friendly, Curious, Helpful, Witty
- **Reply History**: Track all generated replies with statistics
- **Copy & Post**: Copy to clipboard or post directly to the platform

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `chrome-extension` folder

### Icons

Before loading, create icon files in the `icons/` folder:
- `icon16.png` (16x16)
- `icon32.png` (32x32)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

You can use any icon generator or the NEXUS logo. The icon should feature the layered diamond/prism shape.

## Setup

1. Click the NEXUS extension icon in your browser toolbar
2. Enter your Gemini API key (get one free at [Google AI Studio](https://makersuite.google.com/app/apikey))
3. Configure your default tone preference
4. Navigate to LinkedIn, Twitter/X, or Reddit

## Usage

1. Browse LinkedIn, Twitter, or Reddit as normal
2. Look for the purple "NEXUS" button on posts
3. Click the button to open the reply modal
4. Select your preferred tone
5. Click "Generate Reply" to create an AI-powered response
6. Edit the reply if needed
7. Click "Copy" to copy to clipboard, or "Post Reply" to post directly

## File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API calls
├── content-scripts/
│   ├── linkedin.js        # LinkedIn content script
│   ├── twitter.js         # Twitter/X content script
│   └── reddit.js          # Reddit content script
├── popup/
│   ├── popup.html         # Extension popup UI
│   └── popup.js           # Popup functionality
├── styles/
│   └── nexus-inject.css   # Styles for injected elements
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Permissions

- `storage`: Save API key and settings locally
- `activeTab`: Access current tab for content injection
- `scripting`: Inject scripts into social platforms
- Host permissions for LinkedIn, Twitter/X, and Reddit

## Privacy

- Your API key is stored locally in Chrome storage
- No data is sent to any server except the Gemini API for reply generation
- Reply history is stored locally and never leaves your browser
- The extension does not collect any personal information

## Troubleshooting

### NEXUS button not appearing
- Refresh the page
- Make sure you're on a supported platform (linkedin.com, twitter.com, x.com, reddit.com)
- Check that the extension is enabled in chrome://extensions

### API key not working
- Verify your Gemini API key is valid
- Check if you have API quota remaining
- Try regenerating the key at Google AI Studio

### Reply not posting
- Some platforms may block programmatic posting
- Use the "Copy" button and paste manually if direct posting fails

## Development

To modify the extension:

1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the NEXUS extension card
4. Reload the social media page to see changes

## License

Part of the NEXUS platform. For internal use.
