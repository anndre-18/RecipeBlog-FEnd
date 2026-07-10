import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { FaLock } from "react-icons/fa";
import api from "../utils/api";
import AuthLayout, { AuthLink } from "./AuthLayout";
import "./Login.css";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetToken } = location.state || {};

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!resetToken) {
      navigate("/forgot-password");
    }
  }, [resetToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/reset-password", {
        resetToken,
        newPassword,
        confirmPassword,
      });

      setSuccess(res.data.message || "Password updated successfully.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) return null;

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Create a new secure password"
      footer={
        <AuthLink to="/login">
          Back to login
        </AuthLink>
      }
    >
      <form onSubmit={handleSubmit} className="step-form">
        <div className="input-with-icon">
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <FaLock className="field-icon" />
        </div>

        <div className="input-with-icon">
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <FaLock className="field-icon" />
        </div>

        <p className="auth-hint">
          Password must be 8+ chars with uppercase, lowercase, number, and special character.
        </p>

        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Updating...
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>

      {error && <div className="login-error auth-page-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}
    </AuthLayout>
  );
};

export default ResetPassword;
