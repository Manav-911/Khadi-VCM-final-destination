import { useState } from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Tabs from './pages/Tabs.jsx';
import './styles/page.css';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';

function Home() {
  const navigate = useNavigate()

  return (
    <>
      <div className='home'>
        <button onClick={()=>{navigate("/tabs/*")}}>Go to tab</button>
      </div>
    </>
  )
}

function App()
{
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />}/>
        <Route path="/tabs" element={<Tabs />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App
