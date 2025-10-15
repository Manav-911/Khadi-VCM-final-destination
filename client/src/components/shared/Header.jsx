import React from "react";
import "../../styles/header.css";
import leftLogo from '../../assets/left-logo.png';
import rightLogo from '../../assets/center-logo.png';  // image you want on right
import centerLogo from '../../assets/right-logo.png';  // you want this on center

export default function Header() {
    return (
        <header className="main-header">
            <div className="header-content">
                {/* Left logo stays here */}
                <img src={leftLogo} alt="Left Logo" className="header-logo" />

                {/* Center text block */}
                <div className="header-center">
                    <img src={centerLogo} alt="Khadi India Logo" className="center-logo" />
                    <div className="header-text">
                        <h1><strong>Khadi & Village Industries Commission</strong></h1>
                        <p>Ministry of Micro, Small & Medium Enterprises, Govt. of India</p>
                    </div>
                </div>

                {/* Center image shown on right now */}
                <img src={rightLogo} alt="Right Logo" className="right-logo" />
            </div>
        </header>
    );
}
