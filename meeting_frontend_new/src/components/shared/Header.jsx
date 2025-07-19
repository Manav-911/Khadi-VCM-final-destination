import React from 'react';
import '../../styles/header.css';
import logo from '../../assets/khadilogo.png'

export default function Header() {
  return (
    <header className="dashboard-header">
      <div className="header-content">
        <h1 className="header-title">Khadi Virtual Conference</h1>
        <div className="logo">
          <img src={logo} alt="Khadi Logo" className="logo-image" />
        </div>
        <div className="user-info">
          <span>Welcome, Admin</span>
        </div>
      </div>
    </header>
  );
}
