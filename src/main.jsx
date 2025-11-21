// @ts-nocheck

import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Ensure root element exists before rendering
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Error: Root element not found</h1><p>Please refresh the page.</p></div>';
} else {
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error('Failed to render app:', error);
    rootElement.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Error Loading App</h1><p>Please refresh the page or clear your browser cache.</p><button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px;">Refresh Page</button></div>';
  }
}
