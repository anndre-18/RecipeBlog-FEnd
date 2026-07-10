import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutDialog(false);
    navigate("/login");
  };

  return (
    <>
      <header>
        <img className="logo" src="../public/assets/logo_img.png" alt="image-logo" />
        <nav>
          <Link className="link" to="/">
            Home
          </Link>
          <Link className="link" to="/addrecipe">
            Create
          </Link>
          <Link className="link" to="/favorites">
            Favorites
          </Link>
          <Link className="link" to="/profile">
            Profile
          </Link>

          {isAuthenticated ? (
            <p className="link" onClick={handleLogoutClick}>
              Logout
            </p>
          ) : (
            <Link className="link" to="/login">
              Login
            </Link>
          )}
        </nav>
      </header>

      {showLogoutDialog && (
        <div className="logout-dialog-backdrop" onClick={() => setShowLogoutDialog(false)}>
          <div className="logout-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Do you want to logout?</h3>
            <div className="logout-dialog-actions">
              <button type="button" className="logout-yes" onClick={confirmLogout}>
                Yes
              </button>
              <button
                type="button"
                className="logout-no"
                onClick={() => setShowLogoutDialog(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
