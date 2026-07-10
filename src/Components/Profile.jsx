import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { CgProfile } from "react-icons/cg";
import axios from "axios";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ImageCropperModal from "./ImageCropperModal";
import { blobToFile } from "../utils/cropImage";
import "./Profile.css";

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
  import.meta.env.VITE_CLOUDINARY_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
  import.meta.env.VITE_CLOUDINARY_PRESET;

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [cropSource, setCropSource] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchFavoriteCount = async () => {
      try {
        const res = await api.get("/api/users/me/favoriteIds");
        setFavoriteCount(res.data.length);
      } catch (err) {
        console.error("Failed to fetch favorite count:", err);
      }
    };

    fetchFavoriteCount();

    const handleFavoritesUpdated = (event) => {
      const favorites = event.detail?.favorites;
      if (Array.isArray(favorites)) {
        setFavoriteCount(favorites.length);
      }
    };

    window.addEventListener("favoritesUpdated", handleFavoritesUpdated);
    return () =>
      window.removeEventListener("favoritesUpdated", handleFavoritesUpdated);
  }, [user?.id]);

  const uploadImageToCloudinary = async (file) => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const response = await axios.post(uploadUrl, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.secure_url;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setError("Cloudinary is not configured for profile picture uploads.");
      return;
    }

    setError("");
    setCropSource(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleCropConfirm = async (blob) => {
    setUploading(true);
    setError("");

    try {
      const croppedFile = blobToFile(blob, "profile-picture.jpg");
      const imageUrl = await uploadImageToCloudinary(croppedFile);
      const res = await api.put("/api/users/me/profile-picture", {
        profilePicture: imageUrl,
      });
      updateUser(res.data.user);
      showToast("Profile picture updated.", "success");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to upload profile picture."
      );
      showToast("Failed to upload profile picture.", "error");
    } finally {
      setUploading(false);
      if (cropSource) URL.revokeObjectURL(cropSource);
      setCropSource("");
    }
  };

  const handleCropCancel = () => {
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource("");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.put("/api/users/me", { name: name.trim() });
      updateUser(res.data.user);
      showToast("Profile updated successfully.", "success");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
      showToast("Failed to update profile.", "error");
    } finally {
      setLoading(false);
    }
  };

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

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "N/A";

  return (
    <section className="profile-page">
      <div className="profile-card">
        <div className="profile-top">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-frame">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="profile-avatar-image"
                />
              ) : (
                <div className="profile-avatar">
                  <CgProfile />
                </div>
              )}
            </div>
            <button
              type="button"
              className="profile-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Change Photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              hidden
            />
          </div>
          <div>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <span className="profile-status">
              {user.isVerified ? "Verified" : "Pending verification"}
            </span>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSaveProfile}>
          <div className="profile-field">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="profile-field">
            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" value={user.email} readOnly />
          </div>

          <div className="profile-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value="••••••••••"
              readOnly
            />
            <Link to="/forgot-password" className="profile-change-password">
              Change Password
            </Link>
          </div>

          <div className="profile-grid">
            <div className="profile-item">
              <span>Date Joined</span>
              <strong>{joinedDate}</strong>
            </div>
            <div className="profile-item">
              <span>Saved Favorites</span>
              <strong>{favoriteCount}</strong>
            </div>
            <div className="profile-item">
              <span>Account Status</span>
              <strong>{user.isVerified ? "Active" : "Unverified"}</strong>
            </div>
          </div>

          <button type="submit" className="profile-save-btn" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {error && <p className="profile-message error">{error}</p>}
      </div>

      {cropSource && (
        <ImageCropperModal
          imageSrc={cropSource}
          aspect={1}
          title="Crop Profile Picture"
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </section>
  );
};

export default Profile;
