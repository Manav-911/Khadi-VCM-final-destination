import React from "react";
import { useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import Tab1 from "../components/tab1";
import Tab2 from "../components/tab2";
import Tab3 from "../components/tab3";
import "../styles/page.css";
import "../App.css";
import ScheduleMeeting from "../components/ScheduleMeeting.jsx";
import Header from "../components/shared/Header.jsx";
import Footer from "../components/shared/Footer.jsx";
import ManageUser from "../components/ManageUsers/ManageUser.jsx";
import supabase from "../config/supabaseClient.js";
import CalendarView from "../components/calendar/CalendarView.jsx";
import AddUser from "../components/ManageUsers/AddUser.jsx";

function TabsTemp() {
  const navigate = useNavigate();
  const [action, setAction] = useState("Tab1");
  const [openPopup, setOpenPopup] = useState(false);
  const [user, setUser] = useState("cal");

  return (
    <div style={{ backgroundColor: "#F5F5F5" }}>
      <div className="header">
        <Header />
      </div>
      <div className="content">
        <div className="left-panel">
          <div className="button-group">
            <button className="btn" onClick={() => setOpenPopup(true)}>
              Schedule Meeting
            </button>
            <button className="btn" onClick={()=> setUser("manage")}> Manage user
            </button>
            <button className="btn" onClick={()=> setUser("cal")}>Show Calendar</button>
          </div>
        </div>
        <div className="model-overlay">
          <ScheduleMeeting
            open={openPopup}
            onClose={() => setOpenPopup(false)}
          />
        </div>
        <div className="right-panel">
          <div className="button-group">
            <button
              className={action === "Tab1" ? "btn" : "btn active"}
              onClick={() => {
                setAction("Tab1");
              }}
            >
              Pending
            </button>
            <button
              className={action === "Tab2" ? "btn" : "btn active"}
              onClick={() => {
                setAction("Tab2");
              }}
            >
              Approved
            </button>
            <button
              className={action === "Tab3" ? "btn" : "btn active"}
              onClick={() => {
                setAction("Tab3");
              }}
            >
              Declined
            </button>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="left-panel-meeting">
          {user==="manage"?<ManageUser/>:null}
          {user==="cal"?<CalendarView/>:null}
        </div>
        <div className="right-panel-meeting">
          {action==="Tab1"?<Tab1/>:null}
          {action==="Tab2"?<Tab2/>:null}
          {action==="Tab3"?<Tab3/>:null}
        </div>
      </div>
    </div>
  );
}

function Tabs() {
   return (
    <>
      <TabsTemp />
    </>
  );
}

export default Tabs;
