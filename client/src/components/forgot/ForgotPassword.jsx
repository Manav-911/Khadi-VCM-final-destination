import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/login.css";
import Header from "../shared/Header";
import Footer from "../shared/Footer";

export default function ForgotPassword() {
  const [formData, setFormData] = useState({
    email: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
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
      const response = await axios.post(
        "http://localhost:3000/login/forgot-password",
        {
          email: formData.email,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setResetSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setErrors({ server: response.data.message || "Request failed" });
      }
    } catch (error) {
      console.error("Password reset error:", error.response?.data || error.message);
      setErrors({
        server:
          error.response?.data?.message || "Server error. Try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="page-container">
      {/* Fixed Header */}
      <Header></Header>

      {/* Centered Reset Password Container */}
      <main className="login-main">
        <div className="login-container" style={{ maxWidth: '400px', padding: '1.5rem' }}>
          <h2 className="login-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Forgot Password</h2>

          {resetSuccess ? (
            <div className="success-message">
              <p>Password reset link sent to your email!</p>
              <p>Redirecting to login page...</p>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleSubmit}>
              {errors.server && (
                <div className="error-message" style={{ marginBottom: '0.75rem', padding: '0.5rem' }}>{errors.server}</div>
              )}

              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' ,color: 'blue',fontWeight:'500'}}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="email" style={{ fontSize: '0.9rem', marginBottom: '0.3rem' }}>E-Mail</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your registered email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "error" : ""}
                  style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                />
                {errors.email && (
                  <span className="error-text" style={{ fontSize: '0.8rem' }}>{errors.email}</span>
                )}
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={isSubmitting}
                style={{ padding: '0.6rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
              >
                {isSubmitting ? "SENDING..." : "SEND RESET LINK"}
              </button>

              <div className="back-to-login" style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="link-button"
                  style={{ fontSize: '0.85rem' }}
                >
                  Back to Login
                </button>
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