// @ts-nocheck
/* eslint-disable no-unused-vars */

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { appTheme } from './theme';
import LoginPage from './Components/Pages/Login';
import LandingPage from './Components/Pages/LandingPage';
import SidebarLayout from './SideBarLayout';
import RegisterPage from './Components/Pages/RegisterPage';
import TermsAndConditions from './Components/Pages/TermsAndConditions';
import TermsGuard from './Components/TermsGuard';
import AuthGuard from './Components/AuthGuard';
import SurveyGuard from './Components/SurveyGuard';
import ErrorBoundary from './Components/ErrorBoundary';
import AdminGuard from './Components/AdminGuard';
import SessionDataBootstrap from './Components/SessionDataBootstrap';
import PWAProvider from './Components/PWAProvider';
import UpdateProvider from './Components/UpdateProvider';
import RouteTracker from './Components/RouteTracker';
import ErrorPage from './Components/Pages/ErrorPage';

function App() {

  return (
    <ErrorBoundary>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <UpdateProvider>
          <BrowserRouter>
            <PWAProvider>
              <RouteTracker />
              <Routes>
                {/* Admin routes (completely separate from user auth) */}
                <Route path="/admin" element={<AdminGuard />} />

                {/* User routes with guards */}
                <Route path="/*" element={
                  <TermsGuard>
                    <AuthGuard>
                      <SessionDataBootstrap>
                        <SurveyGuard>
                        <Routes>
                          {/* Pages that don't require SidebarLayout */}
                          <Route path="/" element={<LandingPage />} />
                          <Route path="/auth/login" element={<LoginPage />} />
                          <Route path="/auth/register" element={<RegisterPage />} />
                          <Route path="/terms" element={<TermsAndConditions />} />
                          <Route path="/error" element={<ErrorPage />} />

                          {/* Bottom-nav shell — pages kept mounted for fast tab switching */}
                          <Route element={<SidebarLayout />}>
                            <Route path="/summary" />
                            <Route path="/survey" />
                            <Route path="/log" />
                            <Route path="/tasks" />
                            <Route path="/settings" />
                            <Route path="/resources" />
                            <Route path="/home" />
                            <Route path="/tasks-leaderboard" />
                          </Route>
                        </Routes>
                        </SurveyGuard>
                      </SessionDataBootstrap>
                    </AuthGuard>
                  </TermsGuard>
                } />
              </Routes>
            </PWAProvider>
          </BrowserRouter>
        </UpdateProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
