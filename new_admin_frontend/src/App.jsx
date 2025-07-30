import { useState } from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Tabs from './pages/Tabs.jsx';
import './styles/page.css';

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
        <Route path="/" element={<Home />} />
        <Route path="/tabs/*" element={<Tabs />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
