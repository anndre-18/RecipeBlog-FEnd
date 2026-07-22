import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { FaEnvelope, FaLock } from "react-icons/fa";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout, { AuthLink } from "./AuthLayout";
import "./login-register.css";

const Login = () => {
  const [mode, setMode] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data?.token) {
        login(res.data.token, res.data.user);
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const emailValue = email.trim().toLowerCase();

    try {
      await api.post("/api/auth/login/send-otp", { email: emailValue });
      navigate("/verify-otp", {
        state: { purpose: "login", email: emailValue },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back, Chef!"
      subtitle="Every trail leads to something tasty"
      footer={
        <AuthLink to="/register">
          New here? Create an account
        </AuthLink>
      }
    >
      <div className="auth-tabs">
        <button
          type="button"
          className={mode === "password" ? "auth-tab active" : "auth-tab"}
          onClick={() => {
            setMode("password");
            setError("");
          }}
        >
          Password
        </button>
        <button
          type="button"
          className={mode === "otp" ? "auth-tab active" : "auth-tab"}
          onClick={() => {
            setMode("otp");
            setError("");
          }}
        >
          OTP Login
        </button>
      </div>

      {mode === "password" ? (
        <form onSubmit={handlePasswordLogin} className="step-form">
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

          <Link to="/forgot-password" className="auth-inline-link">
            Forgot password?
          </Link>

          <button type="submit" disabled={loading} className="primary-btn">
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpLogin} className="step-form">
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
      )}

      {error && <div className="login-error auth-page-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}
    </AuthLayout>
  );
};

export default Login;
