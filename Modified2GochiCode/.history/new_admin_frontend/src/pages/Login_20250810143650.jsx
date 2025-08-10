import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styles/login.css";  
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import Tabs from './Tabs';


export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
     if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Try USER login first
      const userRes = await axios.post("http://localhost:5000/login/user", formData, { withCredentials: true });
      if (userRes.data.success) {
        navigate("/dashboard");
        return;
      }

      // If user login fails, try ADMIN login
      const adminRes = await axios.post("http://localhost:5000/login/admin", formData, { withCredentials: true });
      if (adminRes.data.success) {
        navigate("/tabs");
      } else {
        setError(adminRes.data.message);
        console.log(setError);
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Login failed");
      } else {
        setError("Server not reachable");
      }
    } 
    finally 
    {
      setIsSubmitting(false);
    }
  };

  const handleRegisterRedirect = () =>{
    navigate('/register');
  }

  return (
    <div className="page-container">
      {/* Fixed Header */}
      <Header></Header>

      {/* Centered Login Container */}
      <main className="login-main">
        <div className="login-container">
          <h2 className="login-title">Log In to Khadi VCIM</h2>
          
          {loginSuccess ? (
            <div className="success-message">
              <p>Login successful! You will be logged in a moment.</p>
              {/* Add a link to login page if available */}
            </div>
          ) : (
            <form className="login-form" onSubmit={handleSubmit}>
              {errors.server && (
                <div className="error-message">{errors.server}</div>
              )}

              
              <div className="form-group">
                <label htmlFor="email">E-Mail</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  placeholder="Enter your E-mail" 
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password"
                  placeholder="Enter your password" 
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>
              
              <button 
                type="submit" 
                className="login-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'LOGGING IN...' : 'LOGIN'}
              </button>

            </form>
          )}
        </div>
      </main>

      {/* Fixed Footer */}
      <Footer></Footer>
      
    </div>
  );
}