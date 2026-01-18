// @ts-nocheck

import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { migrateAuthData } from './utils/authUtils'

// Run migration early to clear old auth data before app initializes
migrateAuthData();

// Import error logger
import { logError } from './utils/errorLogger';

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  logError(event.error, {
    component: 'GlobalErrorHandler',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  const error = event.reason instanceof Error 
    ? event.reason 
    : new Error(String(event.reason));
  logError(error, {
    component: 'UnhandledRejection',
    reason: event.reason,
  });
});

// Register service worker for PWA functionality (caching disabled)
// ServiceWorker is registered only to satisfy PWA manifest requirements
// It does not cache anything - all requests go directly to network
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register the service worker first, then clean up old registrations
    // This prevents race conditions from unregistering before registering
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Check for service worker updates periodically
        setInterval(() => {
          registration.update();
        }, 5 * 60 * 1000); // Check for updates every 5 minutes
        
        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is ready, notify app
                console.log('New service worker available, app update detected');
                // Dispatch custom event that UpdateProvider can listen to
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          }
        });
        
        // Clean up any old service worker registrations (except the current one)
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => {
            if (reg !== registration && reg.scope !== registration.scope) {
              reg.unregister().then((success) => {
                if (success) {
                  console.log('Old service worker unregistered:', reg.scope);
                }
              });
            }
          });
        });
      })
      .catch((registrationError) => {
        console.error('Service Worker registration failed:', registrationError);
        logError(registrationError, {
          component: 'ServiceWorker',
          stage: 'registration',
        });
      });
    
    // Add utility function to unregister service worker (for debugging)
    window.unregisterServiceWorker = () => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      });
    };
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
    logError(error, {
      component: 'AppInitialization',
      stage: 'render',
    });
    rootElement.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Error Loading App</h1><p>Please refresh the page or clear your browser cache.</p><button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px;">Refresh Page</button></div>';
  }
}
