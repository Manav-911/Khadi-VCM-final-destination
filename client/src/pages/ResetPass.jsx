import React, { useState } from "react";
import axios from "axios";
import "../styles/login.css";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function ResetPass() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get token and userId from URL query params
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const userId = searchParams.get("id");
    const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      setMessage("New password is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        "http://localhost:3000/reset-password/reset",
        { userId, token, newPassword }
      );

      setMessage(response.data.message || "Password reset successfully!");
      if(response.data.success){
        navigate("/login");
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
          <h2 className="login-title">Reset Password</h2>
          <p>Enter your new password below.</p>

          <form onSubmit={handleSubmit}>
            {message && <div className="info-message">{message}</div>}

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="login-button" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
