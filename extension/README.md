# Browser Extension Installation Guide

This guide will help you install the browser extension in developer mode using the unpacked files.

## Prerequisites

- A compatible web browser (Chrome, Edge, Firefox, etc.)
- The extension files (unzipped to a local folder)

## Installation Steps

### For Chrome/Edge

1. Extract the extension files
   - Locate your downloaded extension ZIP file
   - Right-click the file and select "Extract All"
   - Choose a destination folder and click "Extract"

2. Open your browser's extension page
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`
   - Or use the menu: Settings > Extensions

3. Enable Developer Mode
   - Look for the "Developer mode" toggle in the top-right corner
   - Switch it to the ON position

4. Load the extension
   - Click the "Load unpacked" button that appears
   - Browse to the folder where you extracted the extension files
   - Select the folder containing the `manifest.json` file
   - Click "Select Folder" (Windows) or "Open" (Mac)

### For Firefox

1. Extract the extension files
   - Locate your downloaded extension ZIP file
   - Right-click the file and select "Extract All"
   - Choose a destination folder and click "Extract"

2. Open Firefox and navigate to `about:debugging`

3. Click "This Firefox" in the left sidebar

4. Click "Load Temporary Add-on"
   - Browse to the folder where you extracted the extension files
   - Select the `manifest.json` file
   - Click "Open"

## Verification

- The extension should appear in your browser's extension list
- Look for the extension icon in your browser's toolbar
- If the icon is hidden, you may need to pin it to the toolbar

## Notes

- Developer mode installations need to be reloaded after browser updates
- Firefox temporary add-ons will need to be reinstalled after browser restart
- Keep the extracted folder intact as long as you want to use the extension
