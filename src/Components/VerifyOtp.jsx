import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "./AuthLayout";
import OtpInput from "./OtpInput";
import "./login-register.css";

const purposeConfig = {
  register: {
    title: "Verify Your Email",
    verifyEndpoint: "/api/auth/register/verify",
    resendEndpoint: "/api/auth/register/send-otp",
    successPath: "/",
  },
  login: {
    title: "Enter Login Code",
    verifyEndpoint: "/api/auth/login/verify-otp",
    resendEndpoint: "/api/auth/login/send-otp",
    successPath: "/",
  },
  reset: {
    title: "Verify Reset Code",
    verifyEndpoint: "/api/auth/forgot-password/verify-otp",
    resendEndpoint: "/api/auth/forgot-password/send-otp",
    successPath: "/reset-password",
  },
};

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { purpose = "login", email = "", name, password, confirmPassword } =
    location.state || {};

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const config = purposeConfig[purpose];

  useEffect(() => {
    if (!email || !config) {
      navigate("/login");
    }
  }, [email, config, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    setCanResend(false);
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const handleVerify = async (e) => {
    e?.preventDefault?.();
    setError("");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(config.verifyEndpoint, {
        email,
        otp: otpValue,
      });

      if (purpose === "reset") {
        navigate(config.successPath, {
          state: { resetToken: res.data.resetToken, email },
        });
        return;
      }

      if (res.data?.token) {
        login(res.data.token, res.data.user);
        navigate(config.successPath);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!config.resendEndpoint) return;

    setError("");
    setLoading(true);
    try {
      const payload =
        purpose === "register"
          ? { name, email, password, confirmPassword }
          : { email };

      await api.post(config.resendEndpoint, payload);
      setOtp(["", "", "", "", "", ""]);
      setTimeLeft(60);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  if (!config) return null;

  return (
    <AuthLayout
      title={config.title}
      subtitle={
        <>
          Enter the code sent to <strong>{email}</strong>
        </>
      }
    >
      <form onSubmit={handleVerify} className="step-form">
        <OtpInput otp={otp} setOtp={setOtp} />

        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Verifying...
            </>
          ) : (
            "Verify OTP"
          )}
        </button>

        <div className="timer-section">
          {canResend && config.resendEndpoint ? (
            <button
              type="button"
              className="link-btn"
              onClick={handleResend}
              disabled={loading}
            >
              Resend OTP
            </button>
          ) : (
            <span className="timer-text">
              {timeLeft > 0
                ? `Resend OTP in 00:${timeLeft < 10 ? `0${timeLeft}` : timeLeft}`
                : "You can resend OTP now"}
            </span>
          )}
        </div>
      </form>

      {error && <div className="login-error auth-page-error">{error}</div>}

      <Link
        to={purpose === "register" ? "/register" : "/login"}
        className="auth-inline-link centered"
      >
        Go back
      </Link>
    </AuthLayout>
  );
};

export default VerifyOtp;
