import React from 'react';
import { useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import Tab1 from '../components/tab1';
import Tab2 from '../components/tab2';
import Tab3 from '../components/tab3';
import '../styles/page.css';
import '../App.css';
import ScheduleMeeting from '../components/ScheduleMeeting.jsx';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';

function TabsTemp() {
    const navigate = useNavigate();
    const [action, setAction] = useState('Tab1');
    const [openPopup, setOpenPopup] = useState(false);

    return (
        <div style={{ backgroundColor: '#F5F5F5'}}>
            <div className='header'>
                <Header/>
            </div>
            <div className="content">
                <div className='left-panel'>
                <div className="button-group">
                    <button className='btn' onClick={() => setOpenPopup(true)}>Schedule Meeting</button>
                    <button className='btn'>Add user</button>
                </div>
            </div>
            <div className="model-overlay">
                <ScheduleMeeting open={openPopup} onClose={()=>setOpenPopup(false)}/>
            </div>
            <div className="right-panel">
                <div className='tabs'>
                <button className={action==='Tab1'? 'tabs active':'tabs button'} onClick={()=>{navigate('/tabs/tab1'), setAction('Tab1')}}>Pending</button>
                <button className={action==='Tab2'? 'tabs active':'tabs button'} onClick={()=>{navigate('/tabs/tab2'), setAction('Tab2')}}>Approved</button>
                <button className={action==='Tab3'? 'tabs active':'tabs button'} onClick={()=>{navigate('/tabs/tab3'), setAction('Tab3')}}>Declined</button>
            </div>
            </div>
            </div>
            </div>
    );
}

function Tabs()
{
    return(
        <>
        <TabsTemp/>
            <Routes>
                <Route path='tab1' element={<Tab1/>}/>
                <Route path='tab2' element={<Tab2/>}/> 
                <Route path='tab3' element={<Tab3/>}/>     
            </Routes>
        </>  
    );
}

export default Tabs;
