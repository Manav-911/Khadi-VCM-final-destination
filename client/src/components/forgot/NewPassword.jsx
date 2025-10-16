import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; 
import axios from "axios";
// Removed external CSS import to resolve compilation error
// import "../styles/login.css"; 

export default function NewPassword() {
  const navigate = useNavigate();
  // CRITICAL: Extract the unique token from the URL path.
  // This assumes your frontend route is defined like <Route path="/reset-password/:token" element={<NewPassword />} />
  const { token } = useParams();
  
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) { // Minimum length for security
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || !token) {
      if (!token) {
        setErrors({ server: "Missing reset token. Please use the link from your email." });
      }
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg("");

    // Send the token (from URL) and the new password to the backend
    const payload = {
      token: token,
      newPassword: formData.newPassword,
    };

    try {
      // Assuming your express server mounts the authRouter at /api/auth,
      // and the reset route is authRouter.post("/reset-password", ...)
      const response = await axios.post("http://localhost:3000/login/reset-password", payload);
      
      if (response.data.success) {
        setSuccessMsg("Password updated successfully! Redirecting to login...");
        setFormData({ newPassword: "", confirmPassword: "" }); 
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setErrors({ server: response.data.message || "Failed to update password." });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setErrors({
        server: error.response?.data?.message || "An error occurred. The link may have expired or been used.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Used Tailwind CSS classes for styling to replace the missing external CSS
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Set a New Password
        </h2>

        {!token && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">
            Error: Invalid or missing reset link.
          </div>
        )}

        {errors.server && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">
            {errors.server}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-center">
            {successMsg}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              placeholder="Enter new password (min 8 chars)"
              value={formData.newPassword}
              onChange={handleChange}
              disabled={isSubmitting || !token}
              className={`w-full p-3 border ${
                errors.newPassword ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
            />
            {errors.newPassword && (
              <span className="text-red-500 text-sm mt-1 block">{errors.newPassword}</span>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting || !token}
              className={`w-full p-3 border ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
            />
            {errors.confirmPassword && (
              <span className="text-red-500 text-sm mt-1 block">{errors.confirmPassword}</span>
            )}
          </div>

          <button 
            type="submit" 
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition duration-200 ${
              isSubmitting || !token 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl'
            }`}
            disabled={isSubmitting || !token}
          >
            {isSubmitting ? "UPDATING..." : "UPDATE PASSWORD"}
          </button>
        </form>
      </div>
    </div>
  );
}
