import React, { useState } from "react";
import axios from "axios";
import "../styles/login.css";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";

export default function ForgotPasswordRequest() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage("Email is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        "http://localhost:3000/reset-password/request",
        { email }
      );

      if (response.data.success) {
        setMessage("✅ Reset link sent to your email!");
      } else {
        setMessage(response.data.message || "❌ Something went wrong");
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      setMessage(error.response?.data?.message || "Server error. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <Header />
      <main className="login-main">
        <div className="login-container">
          <h2 className="login-title">Forgot Password</h2>
          <p>Enter your email to receive a reset link.</p>

          <form onSubmit={handleSubmit}>
            {message && <div className="info-message">{message}</div>}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
