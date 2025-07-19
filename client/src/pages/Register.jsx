import React, { useState } from 'react';
import axios from 'axios';
import "../styles/register.css";  
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import { useNavigate } from 'react-router-dom';


export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
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
      const response = await axios.post('http://localhost:5000/register', formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Registration successful:', response.data);
      setRegistrationSuccess(true);
      setFormData({ name: "", email: "", password: "" });
      navigate('/dashboard');

    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      
      if (error.response?.data?.error) {
        setErrors(prev => ({
          ...prev,
          server: error.response.data.error
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          server: 'Registration failed. Please try again.'
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginRedirect = () =>{
    navigate('/login');
  }

  return (
    <div className="page-container">
      {/* Fixed Header */}
      <Header></Header>

      {/* Centered Login Container */}
      <main className="login-main">
        <div className="login-container">
          <h2 className="login-title">Sign up to Khadi VCIM</h2>
          
          {registrationSuccess ? (
            <div className="success-message">
              <p>Registration successful! You will be logged in a moment.</p>
              {/* Add a link to login page if available */}
            </div>
          ) : (
            <form className="login-form" onSubmit={handleSubmit}>
              {errors.server && (
                <div className="error-message">{errors.server}</div>
              )}
              
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  placeholder="Enter your name" 
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="email">E-mail</label>
                <input 
                  type="text" 
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
                {isSubmitting ? 'REGISTERING...' : 'REGISTER'}
              </button>

              <div className='register-prompt'>
                <p>Already Registered?
                  <span className='register-link' onClick={handleLoginRedirect}>
                    Click Here
                  </span>
                  .
                </p>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Fixed Footer */}
      <Footer></Footer>
      
    </div>
  );
}