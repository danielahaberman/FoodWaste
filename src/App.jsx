// @ts-nocheck
/* eslint-disable no-unused-vars */

import './App.css';
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './Components/Pages/Login';
import LandingPage from './Components/Pages/LandingPage';
// import Users from './Components/Pages/Users';
import SidebarLayout from './SideBarLayout'; // Import your SidebarLayout component
import RegisterPage from './Components/Pages/RegisterPage'; // Import RegisterPage
import FoodLog from './Components/Pages/FoodLog';
import QaPage from './Components/Pages/QaPage';
import TermsAndConditions from './Components/Pages/TermsAndConditions';
import Resources from './Components/Pages/Resources';
import TasksAndLeaderboard from './Components/Pages/TasksAndLeaderboard';
import ConsumeWaste from './Components/Pages/ComsumeWaste';
import Settings from './Components/Pages/Settings';
import TermsGuard from './Components/TermsGuard';
import AuthGuard from './Components/AuthGuard';
import SurveyGuard from './Components/SurveyGuard';
import ErrorBoundary from './Components/ErrorBoundary';
import AdminGuard from './Components/AdminGuard';
import PWAProvider from './Components/PWAProvider';
import RouteTracker from './Components/RouteTracker';

// Cleanup function to remove old auto-login related localStorage items
// This runs synchronously at module load (before any components render)
// to prevent white screens from corrupted auth data
const cleanupAutoLoginData = () => {
  try {
    // Remove old auto-login related keys that could cause issues
    const keysToRemove = [
      'authExpiry',      // Old expiry time used for auto-login checks
      'loginDate',       // Old login date used for auto-login time checks
    ];

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`[Cleanup] Removed old localStorage key: ${key}`);
      } catch (error) {
        console.warn(`[Cleanup] Failed to remove ${key}:`, error);
      }
    });

    // Validate userId exists and is valid (non-empty string)
    // Also clear if it's just whitespace or invalid format
    const userId = localStorage.getItem('userId');
    if (userId !== null) {
      // Check if userId is invalid (empty, whitespace, or not a string)
      if (typeof userId !== 'string' || userId.trim() === '' || userId === 'null' || userId === 'undefined') {
        console.warn('[Cleanup] Invalid userId found, clearing it:', userId);
        localStorage.removeItem('userId');
        // Also clear username since userId is invalid
        localStorage.removeItem('username');
        // Clear any other auth-related data
        localStorage.removeItem('intendedDestination');
        localStorage.removeItem('lastRoute');
      }
    }

    // Validate username if it exists
    const username = localStorage.getItem('username');
    if (username !== null && (typeof username !== 'string' || username.trim() === '')) {
      console.warn('[Cleanup] Invalid username found, clearing it');
      localStorage.removeItem('username');
    }

    console.log('[Cleanup] Auto-login cleanup completed');
  } catch (error) {
    console.error('[Cleanup] Error during cleanup:', error);
    // Don't throw - we want the app to continue even if cleanup fails
  }
};

// Run cleanup immediately when this module loads (before React renders anything)
cleanupAutoLoginData();

function App() {

  return (
    <ErrorBoundary>
      <PWAProvider>
        <BrowserRouter>
          <RouteTracker />
          <Routes>
            {/* Admin routes (completely separate from user auth) */}
            <Route path="/admin" element={<AdminGuard />} />
            
            {/* User routes with guards */}
            <Route path="/*" element={
              <TermsGuard>
                <AuthGuard>
                  <SurveyGuard>
                    <Routes>
                      {/* Pages that don't require SidebarLayout */}
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/auth/login" element={<LoginPage />} />
                      <Route path="/auth/register" element={<RegisterPage />} />
                      <Route path="/terms" element={<TermsAndConditions />} />
                     
                      {/* SidebarLayout wrapped routes */}
                      <Route element={<SidebarLayout />}>
                        <Route path="/summary" element={<ConsumeWaste />} />
                        <Route path="/survey" element={<QaPage />} />
                        <Route path="/log" element={<FoodLog/>} />
                        <Route path="/tasks" element={<TasksAndLeaderboard />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/resources" element={<Resources />} />
                        {/* Legacy route redirects */}
                        <Route path="/home" element={<FoodLog/>} />
                        <Route path="/tasks-leaderboard" element={<TasksAndLeaderboard />} />
                      </Route>
                    </Routes>
                  </SurveyGuard>
                </AuthGuard>
              </TermsGuard>
            } />
          </Routes>
        </BrowserRouter>
      </PWAProvider>
    </ErrorBoundary>
  );
}

export default App;
