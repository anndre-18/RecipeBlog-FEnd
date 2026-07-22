import React, { useState } from "react";
import { useNavigate } from "react-router";
import { FaEnvelope } from "react-icons/fa";
import api from "../utils/api";
import AuthLayout, { AuthLink } from "./AuthLayout";
import "./login-register.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const emailValue = email.trim().toLowerCase();

    try {
      await api.post("/api/auth/forgot-password/send-otp", {
        email: emailValue,
      });

      navigate("/verify-otp", {
        state: { purpose: "reset", email: emailValue },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="We'll send a verification code to your email"
      footer={
        <AuthLink to="/login">
          Back to login
        </AuthLink>
      }
    >
      <form onSubmit={handleSubmit} className="step-form">
        <div className="input-with-icon">
          <input
            type="email"
            placeholder="Registered email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FaEnvelope className="field-icon" />
        </div>

        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Sending OTP...
            </>
          ) : (
            "Send OTP"
          )}
        </button>
      </form>

      {error && <div className="login-error auth-page-error">{error}</div>}
    </AuthLayout>
  );
};

export default ForgotPassword;
