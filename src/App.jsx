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
import TermsGuard from './Components/TermsGuard';
import AuthGuard from './Components/AuthGuard';
import ErrorBoundary from './Components/ErrorBoundary';
function App() {
  return (
    <ErrorBoundary>
      <div style={{ height:"100vh", width:"100vw", boxSizing:"border-box",  }}>
        <div style={{maxWidth:"600px", marginLeft:"auto", marginRight:"auto"}}>
           <BrowserRouter>
            <TermsGuard>
              <AuthGuard>
                <Routes>
                  {/* Pages that don't require SidebarLayout */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth/login" element={<LoginPage />} />
                  <Route path="/auth/register" element={<RegisterPage />} /> {/* RegisterPage outside SidebarLayout */}
                  <Route path="/terms" element={<TermsAndConditions />} />
                 
                  {/* SidebarLayout wrapped routes */}
                  <Route element={<SidebarLayout />}>
                    {/* <Route path="/users" element={<Users />} /> */}
                    <Route path="/home" element={<FoodLog/>} />
                    <Route path="/survey" element={<QaPage />} />
                  </Route>
                </Routes>
              </AuthGuard>
            </TermsGuard>
        </BrowserRouter>
        </div>
       
      </div>
    </ErrorBoundary>
  );
}

export default App;
