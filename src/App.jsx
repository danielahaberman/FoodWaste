/* eslint-disable no-unused-vars */

import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './Components/Pages/Login';
import LandingPage from './Components/Pages/LandingPage';
import Users from './Components/Pages/Users';
import SidebarLayout from './SideBarLayout'; // Import your SidebarLayout component
import RegisterPage from './Components/Pages/RegisterPage'; // Import RegisterPage
import React from 'react';
import FoodLog from './Components/Pages/FoodLog';
function App() {
  return (
    <div style={{ height:"100vh", width:"100vw", boxSizing:"border-box"}}>
      <BrowserRouter>
        <Routes>
          {/* Pages that don't require SidebarLayout */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} /> {/* RegisterPage outside SidebarLayout */}

          {/* SidebarLayout wrapped routes */}
          <Route element={<SidebarLayout />}>
            <Route path="/users" element={<Users />} />
            <Route path="/home" element={<FoodLog/>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
