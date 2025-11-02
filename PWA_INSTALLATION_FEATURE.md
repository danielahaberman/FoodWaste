# PWA Installation Feature

This document describes the Progressive Web App (PWA) installation feature implemented for the Food Waste Tracker application.

## Overview

The PWA installation feature allows users to install the web application on their mobile devices, providing a native app-like experience. The implementation handles both Android and iOS devices with appropriate prompts and instructions.

## Features

### Android Support
- **Automatic Detection**: Detects when the app can be installed using the `beforeinstallprompt` event
- **Native Prompt**: Uses the browser's native installation prompt for a seamless experience
- **Smart Timing**: Shows the prompt at appropriate times (first visit or after 7 days if dismissed)

### iOS Support
- **Manual Instructions**: Provides step-by-step instructions for adding the app to the home screen
- **Share Menu Integration**: Includes a button to open the iOS share menu
- **Visual Guide**: Uses a stepper component to clearly show the installation process

### Cross-Platform Features
- **Standalone Detection**: Automatically detects if the app is already installed
- **Persistent Storage**: Remembers user preferences and timing
- **Responsive Design**: Works on all device sizes with Material-UI components
- **Theme Integration**: Matches the app's blue and white color scheme
- **User Control**: Multiple dismissal options including permanent dismissal

## Implementation Details

### Files Added/Modified

1. **`public/manifest.json`** - PWA manifest file defining app metadata
2. **`public/sw.js`** - Service worker for offline functionality
3. **`src/Components/PWAInstallPrompt.jsx`** - Main installation prompt component
4. **`src/hooks/usePWAInstall.js`** - Custom hook for PWA installation logic
5. **`src/Components/PWAProvider.jsx`** - Global PWA provider component
6. **`src/App.jsx`** - Updated to include PWA provider
7. **`index.html`** - Updated with PWA meta tags and manifest link
8. **`src/main.jsx`** - Added service worker registration

### Key Components

#### PWAInstallPrompt Component
- **Platform Detection**: Automatically detects iOS vs Android
- **Conditional UI**: Shows different interfaces based on platform
- **Material-UI Integration**: Uses consistent design language
- **Accessibility**: Includes proper ARIA labels and keyboard navigation

#### usePWAInstall Hook
- **Event Handling**: Manages `beforeinstallprompt` events
- **Local Storage**: Tracks user interactions and timing
- **State Management**: Provides installation state to components
- **Smart Prompting**: Implements intelligent timing for prompts

### PWA Manifest Configuration

```json
{
  "name": "Food Waste Tracker",
  "short_name": "FoodWaste",
  "description": "Track and reduce food waste with gamification features",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "orientation": "portrait-primary"
}
```

## User Experience

### Android Users
1. Visit the app in Chrome or other supported browsers
2. Receive a native installation prompt (after first visit or 7 days)
3. Tap "Install" to add the app to their home screen
4. App launches in standalone mode without browser UI

### iOS Users
1. Visit the app in Safari
2. See a custom prompt with installation instructions
3. Tap "Open Share Menu" to access Safari's share options
4. Follow the step-by-step guide to add to home screen
5. App launches in standalone mode

## Technical Requirements

### Browser Support
- **Android**: Chrome, Edge, Samsung Internet, Firefox
- **iOS**: Safari 11.3+ (iOS 11.3+)
- **Desktop**: Chrome, Edge, Firefox (for testing)

### PWA Requirements Met
- ✅ Web App Manifest
- ✅ Service Worker
- ✅ HTTPS (required for production)
- ✅ Responsive Design
- ✅ App-like Experience

## Installation Flow

1. **Detection**: App detects if it can be installed
2. **Timing**: Shows prompt at appropriate times
3. **Platform Handling**: Provides platform-specific instructions
4. **User Choice**: Respects user decisions and timing
5. **Persistence**: Remembers user preferences

## Customization

### Styling
The PWA prompt uses the app's existing Material-UI theme with blue (`#1976d2`) and white colors, maintaining visual consistency.

### Timing
- First visit: Shows prompt immediately
- Dismissed: Waits 7 days before showing again
- Accepted: Never shows again
- Permanently dismissed: Never shows again (unless reset)

### Content
All text and instructions can be customized in the `PWAInstallPrompt.jsx` component.

## Testing

### Local Testing
1. Run `npm run dev` to start the development server
2. Open in Chrome and check DevTools > Application > Manifest
3. Test installation prompt on mobile devices
4. Verify service worker registration in DevTools

### Production Testing
1. Deploy to HTTPS-enabled server
2. Test on actual mobile devices
3. Verify PWA installation works correctly
4. Test offline functionality

## Future Enhancements

- **Custom App Icon**: Create a dedicated app icon for better branding
- **Push Notifications**: Add notification support for engagement
- **Offline Functionality**: Enhance offline capabilities
- **App Store Integration**: Consider hybrid app store deployment
- **Analytics**: Track installation rates and user behavior

## Troubleshooting

### Common Issues
1. **Prompt not showing**: Check if app is already installed or if user dismissed recently
2. **iOS instructions unclear**: Ensure user is using Safari and iOS 11.3+
3. **Service worker not registering**: Verify HTTPS and proper file paths
4. **Manifest not loading**: Check file paths and JSON syntax

### Debug Steps
1. Check browser console for errors
2. Verify manifest.json is accessible
3. Test service worker registration
4. Check PWA audit in Chrome DevTools

## User Control Options

### Dismissal Options
1. **"Maybe Later"**: Dismisses for 7 days, then shows again
2. **"Don't Ask Again"**: Permanently dismisses the prompt
3. **Close (X) Button**: Same as "Maybe Later"
4. **Install App**: Never shows again after successful installation

### Reset Preferences
Users can reset their PWA preferences by running `window.resetPWAPreferences()` in the browser console, which will allow the prompt to show again.

## Dependencies

- `react-ios-pwa-prompt`: For iOS-specific installation prompts (installed with --legacy-peer-deps)
- Material-UI components: For consistent UI design
- React hooks: For state management and lifecycle handling

## Browser Compatibility

| Browser | Android | iOS | Desktop |
|---------|---------|-----|---------|
| Chrome | ✅ | ❌ | ✅ |
| Safari | ❌ | ✅ | ✅ |
| Firefox | ✅ | ❌ | ✅ |
| Edge | ✅ | ❌ | ✅ |
| Samsung Internet | ✅ | ❌ | ❌ |

Note: iOS requires Safari for PWA installation, other browsers on iOS cannot install PWAs.
