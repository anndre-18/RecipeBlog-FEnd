import React from "react";
import { Link } from "react-router";
import "./Login.css";

const AuthLayout = ({ title, subtitle, children, footer }) => {
  return (
    <div className="auth-page">
      <div className="login-wrapper auth-page-wrapper">
        <div className="left-panel">
          <div className="login-card auth-page-card">
            <h3 className="name">Tasty trails</h3>
            <h2 className="title">{title}</h2>
            {subtitle && <div className="welcome-subtitle">{subtitle}</div>}
            {children}
          </div>
        </div>
        <div className="right-login">
          <div className="collage-grid" aria-hidden="true">
            <div className="collage-tile">
              <img src="/assets/login_img1.png" alt="Food 1" />
            </div>
            <div className="collage-tile">
              <img src="/assets/login_img2.png" alt="Food 2" />
            </div>
          </div>
        </div>
      </div>
      {footer && <div className="auth-footer">{footer}</div>}
    </div>
  );
};

export const AuthLink = ({ to, children }) => (
  <p className="auth-link-text">
    <Link to={to}>{children}</Link>
  </p>
);

export default AuthLayout;
