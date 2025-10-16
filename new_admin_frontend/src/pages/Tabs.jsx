import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Tab1 from "../components/tab1";
import Tab2 from "../components/tab2";
import Tab3 from "../components/tab3";
import "../styles/page.css";
import "../App.css";
import RequestMeeting from "../components/meeting/RequestMeetingForm.jsx";
import Footer from "../components/shared/Footer.jsx";
import Header from "../components/shared/Header.jsx";
import ManageUser from "../components/ManageUsers/ManageUser.jsx";
import CalendarView from "../components/calendar/CalendarView.jsx";
import AddUser from "../components/ManageUsers/AddUser.jsx";
import { useEffect } from "react";

function TabsTemp() {
  const navigate = useNavigate();
  const [action, setAction] = useState("Tab1");
  const [openPopup, setOpenPopup] = useState(false);
  const [user, setUser] = useState("cal");

  return (
    <div style={{ backgroundColor: "#F5F5F5" }}>
      <Header />
      <div className="content">
        <div className="left-panel">
          <div className="button-group">
            <button className="btn" onClick={() => setOpenPopup(true)}>
              Request Meeting
            </button>
            <button className="btn" onClick={() => setUser("manage")}>
              Manage user
            </button>
            <button className="btn" onClick={() => setUser("cal")}>
              Show Calendar
            </button>
          </div>
        </div>
        
        {/* Conditionally render the overlay only when openPopup is true */}
        {openPopup && (
          <div className="model-overlay">
            <RequestMeeting
              open={openPopup}
              onClose={() => setOpenPopup(false)}
            />
          </div>
        )}
        
        <div className="right-panel">
          <div className="button-group">
            <button
              className={action === "Tab1" ? "btn active" : "btn"}
              onClick={() => setAction("Tab1")}
            >
              Pending
            </button>
            <button
              className={action === "Tab2" ? "btn active" : "btn"}
              onClick={() => setAction("Tab2")}
            >
              Approved
            </button>
            <button
              className={action === "Tab3" ? "btn active" : "btn"}
              onClick={() => setAction("Tab3")}
            >
              Declined
            </button>
            <button
              className={action === "Tab3" ? "btn active" : "btn"}
              onClick={() => setAction("Tab3")}
            >
              Completed
            </button>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="left-panel-meeting">
          {user === "manage" ? <ManageUser /> : null}
          {user === "cal" ? <CalendarView /> : null}
        </div>
        <div className="right-panel-meeting">
          {action === "Tab1" ? <Tab1 /> : null}
          {action === "Tab2" ? <Tab2 /> : null}
          {action === "Tab3" ? <Tab3 /> : null}
        </div>
      </div>
      <Footer /> 
    </div>
  );
}

function Tabs() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log("FULL URL:", window.location.href);
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    const tokenFromStorage = localStorage.getItem("token");

    if (tokenFromUrl) {
      // Token in URL takes priority
      localStorage.setItem("token", tokenFromUrl);
      console.log("✅ Token saved from URL");
      setIsAuthenticated(true);
      // Clean up URL
      window.history.replaceState({}, document.title, "/tabs");
    } else if (tokenFromStorage) {
      // Check if token exists in localStorage
      console.log("✅ Token found in localStorage");
      setIsAuthenticated(true);
    } else {
      console.warn("⚠️ No token found - Please login");
      setIsAuthenticated(false);
      // Optionally redirect to login
      // navigate('/login');
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        <div>
          <p>⚠️ Authentication required</p>
          <p>Please ensure you have a valid token in the URL or localStorage.</p>
          <button 
            onClick={() => window.location.href = '/'} 
            style={{ 
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <TabsTemp />
    </>
  );
}

export default Tabs;