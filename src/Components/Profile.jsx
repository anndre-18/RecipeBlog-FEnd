import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CgProfile } from "react-icons/cg";
import { BsThreeDotsVertical } from "react-icons/bs";
import axios from "axios";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ImageCropper from "./ImageCropper";
import ConfirmDialog from "./ConfirmDialog";
import "./Profile.css";

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
  import.meta.env.VITE_CLOUDINARY_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
  import.meta.env.VITE_CLOUDINARY_PRESET;

const Profile = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [myRecipes, setMyRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(true);

  // Cropper state
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState({ open: false, recipeId: null });

  // Dropdown menu
  const [openMenuId, setOpenMenuId] = useState(null);

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

  useEffect(() => {
    const fetchMyRecipes = async () => {
      try {
        const res = await api.get("/api/recipes/mine");
        setMyRecipes(res.data);
      } catch (err) {
        console.error("Failed to fetch my recipes:", err);
        toast.error("Failed to load your recipes");
      } finally {
        setLoadingRecipes(false);
      }
    };
    if (user?.id) fetchMyRecipes();
  }, [user?.id, toast]);

  const uploadImageToCloudinary = async (blob) => {
    const form = new FormData();
    form.append("file", blob, "profile.jpg");
    form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const response = await axios.post(uploadUrl, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.secure_url;
  };

  const handleProfilePictureSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error("Cloudinary is not configured for profile picture uploads.");
      return;
    }

    const objUrl = URL.createObjectURL(file);
    setRawImageSrc(objUrl);
    setShowCropper(true);
  };

  const handleCropConfirm = async (blob) => {
    setShowCropper(false);
    URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(null);

    setUploading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(blob);
      const res = await api.put("/api/users/me/profile-picture", {
        profilePicture: imageUrl,
      });
      updateUser(res.data.user);
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.put("/api/users/me", { name: name.trim() });
      updateUser(res.data.user);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecipe = (recipeId) => {
    navigate(`/edit-recipe/${recipeId}`);
  };

  const handleDeleteRecipe = (recipeId) => {
    setDeleteDialog({ open: true, recipeId });
    setOpenMenuId(null);
  };

  const confirmDeleteRecipe = async () => {
    const recipeId = deleteDialog.recipeId;
    setDeleteDialog({ open: false, recipeId: null });

    try {
      await api.delete(`/api/recipes/${recipeId}`);
      setMyRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      toast.success("Recipe deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete recipe");
    }
  };

  const handleChangePassword = () => {
    navigate("/forgot-password");
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
    <>
      <section className="profile-page">
        <div className="profile-card">
          <div className="profile-top">
            <div className="profile-avatar-wrap">
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
              <label className="profile-upload-btn">
                {uploading ? "Uploading..." : "Change Photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureSelect}
                  hidden
                  disabled={uploading}
                />
              </label>
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
              <div className="password-row">
                <input
                  id="password"
                  type="password"
                  value="••••••••••"
                  readOnly
                  className="masked-password"
                />
                <button
                  type="button"
                  className="change-password-btn"
                  onClick={handleChangePassword}
                >
                  Change Password
                </button>
              </div>
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
        </div>

        {/* My Recipes Section */}
        <div className="my-recipes-section">
          <h2 className="my-recipes-title">My Recipes</h2>
          {loadingRecipes ? (
            <p className="my-recipes-loading">Loading your recipes...</p>
          ) : myRecipes.length === 0 ? (
            <div className="my-recipes-empty">
              <p>You haven't created any recipes yet.</p>
              <button
                className="create-recipe-cta"
                onClick={() => navigate("/addrecipe")}
              >
                Create Your First Recipe
              </button>
            </div>
          ) : (
            <div className="my-recipes-grid">
              {myRecipes.map((recipe) => (
                <div key={recipe.id} className="my-recipe-card">
                  <div className="my-recipe-image">
                    <img
                      src={recipe.images?.[0]}
                      alt={recipe.recipeName}
                      loading="lazy"
                    />
                    <span className="my-recipe-time">{recipe.timeRequired}</span>
                  </div>
                  <div className="my-recipe-content">
                    <div className="my-recipe-header">
                      <h3>{recipe.recipeName}</h3>
                      <div className="my-recipe-menu">
                        <button
                          className="menu-toggle"
                          onClick={() =>
                            setOpenMenuId(openMenuId === recipe.id ? null : recipe.id)
                          }
                          aria-label="More options"
                        >
                          <BsThreeDotsVertical size={18} />
                        </button>
                        {openMenuId === recipe.id && (
                          <div className="dropdown-menu">
                            <button onClick={() => handleEditRecipe(recipe.id)}>
                              Edit
                            </button>
                            <button
                              className="delete-option"
                              onClick={() => handleDeleteRecipe(recipe.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="my-recipe-date">
                      Posted {new Date(recipe.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showCropper && rawImageSrc && (
        <ImageCropper
          imageSrc={rawImageSrc}
          aspect={1}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}

      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Delete Recipe?"
        message="Are you sure you want to delete this recipe? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteRecipe}
        onCancel={() => setDeleteDialog({ open: false, recipeId: null })}
      />
    </>
  );
};

export default Profile;
