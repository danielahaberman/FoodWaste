import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from '@mui/material';
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import LoginPage from './Components/Pages/Login';
import LandingPage from './Components/Pages/LandingPage';
import Users from './Components/Pages/Users';

function App() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState("")

  // heres my new thing
  return (
    <div >

      <BrowserRouter>
      <Routes>
         <Route path="/" element={<LandingPage/>}/>
         <Route path="/users" element={<Users/>}/>
 <Route path="/login" element={<LoginPage/>}/>
       <Route path="/home" element={<div>home</div>}/>
       <Route path="/register" element={<div>register</div>}/>
      </Routes>
      
      
      </BrowserRouter>
    </div>
  )
}

export default App
