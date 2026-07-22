import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { RiMenu3Line, RiCloseLine } from "react-icons/ri";
import "./Header.css";

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    setMenuOpen(false);
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutDialog(false);
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header>
        <img className="logo" src="../public/assets/logo_img.png" alt="image-logo" />

        {/* Desktop nav — unchanged */}
        <nav>
          <Link className="link" to="/">Home</Link>
          <Link className="link" to="/addrecipe">Create</Link>
          <Link className="link" to="/favorites">Favorites</Link>
          <Link className="link" to="/profile">Profile</Link>
          {isAuthenticated ? (
            <p className="link" onClick={handleLogoutClick}>Logout</p>
          ) : (
            <Link className="link" to="/login">Login</Link>
          )}
        </nav>

        {/* Hamburger — only visible on mobile via CSS */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <RiCloseLine size={24} /> : <RiMenu3Line size={24} />}
        </button>
      </header>

      {/* Mobile drawer — only shown on mobile via CSS */}
      {menuOpen && (
        <div className="mobile-menu-backdrop" onClick={closeMenu}>
          <nav className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <Link className="mobile-link" to="/" onClick={closeMenu}>Home</Link>
            <Link className="mobile-link" to="/addrecipe" onClick={closeMenu}>Create</Link>
            <Link className="mobile-link" to="/favorites" onClick={closeMenu}>Favorites</Link>
            <Link className="mobile-link" to="/profile" onClick={closeMenu}>Profile</Link>
            {isAuthenticated ? (
              <p className="mobile-link logout-link" onClick={handleLogoutClick}>Logout</p>
            ) : (
              <Link className="mobile-link" to="/login" onClick={closeMenu}>Login</Link>
            )}
          </nav>
        </div>
      )}

      {showLogoutDialog && (
        <div className="logout-dialog-backdrop" onClick={() => setShowLogoutDialog(false)}>
          <div className="logout-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Do you want to logout?</h3>
            <div className="logout-dialog-actions">
              <button type="button" className="logout-yes" onClick={confirmLogout}>Yes</button>
              <button type="button" className="logout-no" onClick={() => setShowLogoutDialog(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
