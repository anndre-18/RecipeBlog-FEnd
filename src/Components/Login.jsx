import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { FaEnvelope } from "react-icons/fa";
import axios from "axios";
import "./Login.css";

const Login = ({ onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const navigate = useNavigate();
  const otpRefs = useRef([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    // Countdown timer for resend only in step 2
    if (step !== 2) return;

    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    setCanResend(false);
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [step, timeLeft]);

  useEffect(() => {
    // When step 2 loads, focus the first OTP box
    if (step === 2) {
      setTimeout(() => otpRefs.current[0]?.focus(), 0);
    }
  }, [step]);

  const handleSendOtp = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setError("");
    setLoading(true);

    const emailValue = email.trim().toLowerCase();
    if (!emailValue) {
      setError("Please enter your email.");
      setLoading(false);
      return;
    }

    try {
      // Keep email consistent with backend lookups
      setEmail(emailValue);
      const res = await axios.post(`${API_BASE_URL}/api/send-otp`, { email: emailValue });
      if (res.status === 200) {
        setStep(2);
        setOtp(["", "", "", "", "", ""]);
        setTimeLeft(30);
        setCanResend(false);
        // When resending while already on step 2, focus may not move automatically.
        setTimeout(() => otpRefs.current[0]?.focus(), 0);
      }
    } catch (err) {
      console.error("Send OTP failed:", err?.response?.status, err?.response?.data);
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    const emailValue = email.trim().toLowerCase();
    if (!emailValue) {
      setError("Please enter your email.");
      return;
    }

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/verify-otp`, {
        email: emailValue,
        otp: otpValue,
      });

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));
        onClose?.();
        navigate("/");
      }
    } catch (err) {
      console.error("Verify OTP failed:", err?.response?.status, err?.response?.data);
      setError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, value) => {
    // Only allow one digit
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const resendLabel =
    timeLeft > 0 ? `Resend OTP in 00:${timeLeft < 10 ? `0${timeLeft}` : timeLeft}` : "Resend OTP";

  return (
    <div className="backdrop" onClick={onClose}>
      <h2 className="title">Tasty trails</h2>
      <dialog className="model" open onClick={(e) => e.stopPropagation()}>
        
        <div className="login-wrapper">
          
          {/* LEFT: Login */}
          <div className="left-panel">
            
            <div className="login-card" aria-live="polite">  

              <h3 className="name">Tasty trails</h3>
              <h2 className="title">Welcome Back, Chef!</h2>
              <div className="welcome-subtitle">Every trail leads to something tasty</div>

              <div className="step-host" key={step}>
                {step === 1 && (
                  <form onSubmit={handleSendOtp} className="step-form step-animate">
                    <div className="field">
                      <div className="input-with-icon">
                        <input
                          type="email"
                          placeholder="E-mail"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        <FaEnvelope className="field-icon" />
                      </div>
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

                {step === 2 && (
                  <form onSubmit={handleVerifyOtp} className="step-form step-animate">
                    <div className="subtitle">
                      Enter code sent to <strong>{email}</strong>
                    </div>

                    <div className="otp-grid" role="group" aria-label="OTP inputs">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpRefs.current[index] = el)}
                          className="otp-cell"
                          type="text"
                          inputMode="numeric"
                          pattern="\d*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                        />
                      ))}
                    </div>

                    <button type="submit" disabled={loading} className="primary-btn">
                      {loading ? (
                        <>
                          <span className="spinner" aria-hidden="true" />
                          Verifying...
                        </>
                      ) : (
                        "Verify"
                      )}
                    </button>

                    <div className="timer-section">
                      {canResend ? (
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => handleSendOtp()}
                          disabled={loading}
                        >
                          Resend OTP
                        </button>
                      ) : (
                        <span className="timer-text">{resendLabel}</span>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {error && <div className="login-error">{error}</div>}

              {step === 2 && (
                <button
                  type="button"
                  className="change-email"
                  onClick={() => {
                    setStep(1);
                    setError("");
                    setOtp(["", "", "", "", "", ""]);
                    setTimeLeft(30);
                    setCanResend(false);
                  }}
                >
                  Change Email
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Food collage */}
          <div className="right-login">
            <div className="collage-grid" aria-hidden="true">
              <div className="collage-tile">
                <img src="/assets/login_img1.png" alt="Food 1" />
              </div>
              <div className="collage-tile">
                <img src="/assets/login_img2.png" alt="Food 2" />
              </div>
              {/* <div className="collage-tile">
                <img src="/assets/login_img2.png" alt="Food 3" />
              </div>
              <div className="collage-tile">
                <img src="/assets/login_img1.png" alt="Food 4" /> 
              </div> */}
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default Login;
