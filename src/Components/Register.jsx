import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout, { AuthLink } from "./AuthLayout";
import "./Login.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const emailValue = email.trim().toLowerCase();

    try {
      await api.post("/api/auth/register/send-otp", {
        name: name.trim(),
        email: emailValue,
        password,
        confirmPassword,
      });

      navigate("/verify-otp", {
        state: {
          purpose: "register",
          email: emailValue,
          name: name.trim(),
          password,
          confirmPassword,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join the recipe community today"
      footer={
        <AuthLink to="/login">
          Already have an account? Login
        </AuthLink>
      }
    >
      <form onSubmit={handleSubmit} className="step-form">
        <div className="input-with-icon">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <FaUser className="field-icon" />
        </div>

        <div className="input-with-icon">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FaEnvelope className="field-icon" />
        </div>

        <div className="input-with-icon">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <FaLock className="field-icon" />
        </div>

        <div className="input-with-icon">
          <input
            type="password"
            placeholder="Confirm password"
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
              Sending OTP...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </form>

      {error && <div className="login-error auth-page-error">{error}</div>}
    </AuthLayout>
  );
};

export default Register;
