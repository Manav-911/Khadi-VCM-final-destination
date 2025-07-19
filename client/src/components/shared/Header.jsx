import React from "react";
import "../../styles/header.css"
import leftLogo from '../../assets/left-logo.png';
import centerLogo from '../../assets/center-logo.png';
import rightLogo from '../../assets/right-logo.png';

export default function Header(){
    return(
        <>
             <header className="main-header">
                <div className="header-content">
                  <img src={leftLogo} alt="Left Logo" className="header-logo" />
                  <div className="header-center">
                    <img src={centerLogo} alt="Khadi India Logo" className="center-logo" />
                    <div className="header-text">
                      <h1>Khadi & Village Industries Commission</h1>
                      <p>Ministry of Micro, Small & Medium Enterprises, Govt. of India</p>
                    </div>
                  </div>
                  <img src={rightLogo} alt="Right Logo" className="header-logo" />
                </div>
              </header>
        </>
    );
}