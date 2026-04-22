import React, { useMemo } from "react";
import { CgProfile } from "react-icons/cg";
import "./Profile.css";

const Profile = () => {
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      return null;
    }
  }, []);

  if (!user) {
    return (
      <section className="profile-page">
        <div className="profile-card">
          <h2>Profile</h2>
          <p className="profile-empty">No user details found. Please login again.</p>
        </div>
      </section>
    );
  }

  const displayName = user.uname || user.name || "Recipe Lover";
  const email = user.email || "No email available";
  const userId = user.id || "Not available";
  const favoriteCount = Array.isArray(user.favorites) ? user.favorites.length : 0;

  return (
    <section className="profile-page">
      <div className="profile-card">
        <div className="profile-top">
          <div className="profile-avatar">
            <CgProfile />
          </div>
          <div>
            <h2>{displayName}</h2>
            <p>{email}</p>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-item">
            <span>User ID</span>
            <strong>{userId}</strong>
          </div>
          <div className="profile-item">
            <span>Saved Favorites</span>
            <strong>{favoriteCount}</strong>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;
