import React, { useEffect, useRef } from "react";

const OtpInput = ({ otp, setOtp, onComplete }) => {
  const otpRefs = useRef([]);

  useEffect(() => {
    otpRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (value !== "" && index === 5 && newOtp.every((digit) => digit)) {
      onComplete?.(newOtp.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
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
  );
};

export default OtpInput;
