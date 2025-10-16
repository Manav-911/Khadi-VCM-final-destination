import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/login.css";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
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

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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
        "http://localhost:3000/login/user",
        formData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setLoginSuccess(true);
        localStorage.setItem("token", response.data.token);
        navigate("/dashboard");
      } else {
        setErrors({ server: response.data.message || "Login failed" });
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      setErrors({
        server:
          error.response?.data?.message || "Server error. Try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/login/admin",
        formData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setLoginSuccess(true);
        console.log(response.data.token);

        window.location.href = `http://localhost:5174/tabs?token=${response.data.token}`;
      } else {
        setErrors({ server: response.data.message || "Login failed" });
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      setErrors({
        server:
          error.response?.data?.message || "Server error. Try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterRedirect = () => {
    navigate("/register");
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

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
                  className={errors.email ? "error" : ""}
                />
                {errors.email && (
                  <span className="error-text">{errors.email}</span>
                )}
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
                  className={errors.password ? "error" : ""}
                />
                {errors.password && (
                  <span className="error-text">{errors.password}</span>
                )}
              </div>

              <div className="forgot-password-link">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="link-button"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "LOGGING IN..." : "LOGIN"}
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