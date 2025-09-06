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
import TermsGuard from './Components/TermsGuard';
import AuthGuard from './Components/AuthGuard';
import SurveyGuard from './Components/SurveyGuard';
import ErrorBoundary from './Components/ErrorBoundary';
import AdminGuard from './Components/AdminGuard';
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
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
                      <Route path="/home" element={<FoodLog/>} />
                      <Route path="/survey" element={<QaPage />} />
                      <Route path="/resources" element={<Resources />} />
                      <Route path="/tasks-leaderboard" element={<TasksAndLeaderboard />} />
                    </Route>
                  </Routes>
                </SurveyGuard>
              </AuthGuard>
            </TermsGuard>
          } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
