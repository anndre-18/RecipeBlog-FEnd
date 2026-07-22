import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { IoMdHeartEmpty, IoMdHeart } from "react-icons/io";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdEdit, MdDelete } from "react-icons/md";
import RecipeDetails from "./RecipeDetails";
import ConfirmDialog from "./ConfirmDialog";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./Recipeitem.css";
import recipeImage from "./image.png";

const Recipeitem = ({ data, onRecipeDeleted }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, updateUser } = useAuth();
  const toast = useToast();

  const [likedItems, setLikedItems] = useState({});
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Remove-from-favorites confirmation
  const [removeConfirm, setRemoveConfirm] = useState({ open: false, item: null });

  // Delete recipe confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, recipeId: null });

  const menuRef = useRef(null);

  const applyAutoZoomForRatio = (event) => {
    const image = event.currentTarget;
    const ratio = image.naturalWidth / image.naturalHeight;
    const fitScale = ratio < 4 / 3 ? 1.18 : 1;
    image.style.setProperty("--fit-scale", String(fitScale));
  };

  const formatCreatedTime = (value) => {
    if (!value) return "Just now";
    const created = new Date(value);
    if (Number.isNaN(created.getTime())) return "Just now";
    const now = new Date();
    const diffMs = now - created;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))} min ago`;
    if (diffMs < day) return `${Math.floor(diffMs / hour)} hr ago`;
    if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} day ago`;
    return created.toLocaleDateString();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  // Load favorite IDs from DB
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchFavoriteIds = async () => {
      try {
        const response = await api.get("/api/users/me/favoriteIds");
        const map = {};
        response.data.forEach((id) => { map[id] = true; });
        setLikedItems(map);
      } catch (error) {
        console.error("Failed to fetch favorite IDs:", error);
      }
    };
    fetchFavoriteIds();
  }, [isAuthenticated]);

  const handleLikeClick = async (item, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info("Please login to save favorites.");
      return;
    }

    const isLiked = likedItems[item._id];

    // If already liked and trying to remove — show confirmation
    if (isLiked) {
      setRemoveConfirm({ open: true, item });
      return;
    }

    // Otherwise add to favorites immediately
    setLikedItems((prev) => ({ ...prev, [item._id]: true }));
    try {
      const response = await api.post("/api/favorites/toggle", { recipeId: item._id });
      const updatedFavorites = response.data.favorites;
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      updateUser({ ...storedUser, favorites: updatedFavorites });
      window.dispatchEvent(
        new CustomEvent("favoritesUpdated", { detail: { favorites: updatedFavorites } })
      );
      toast.success("Added to favorites");
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      setLikedItems((prev) => ({ ...prev, [item._id]: false }));
      toast.error("Failed to update favorites");
    }
  };

  const confirmRemoveFavorite = async () => {
    const item = removeConfirm.item;
    setRemoveConfirm({ open: false, item: null });
    setLikedItems((prev) => ({ ...prev, [item._id]: false }));

    try {
      const response = await api.post("/api/favorites/toggle", { recipeId: item._id });
      const updatedFavorites = response.data.favorites;
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      updateUser({ ...storedUser, favorites: updatedFavorites });
      window.dispatchEvent(
        new CustomEvent("favoritesUpdated", { detail: { favorites: updatedFavorites } })
      );
      toast.success("Removed from favorites");
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      setLikedItems((prev) => ({ ...prev, [item._id]: true }));
      toast.error("Failed to update favorites");
    }
  };

  const handleEditRecipe = (e, recipeId) => {
    e.stopPropagation();
    setOpenMenuId(null);
    navigate(`/edit-recipe/${recipeId}`);
  };

  const handleDeleteClick = (e, recipeId) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setDeleteConfirm({ open: true, recipeId });
  };

  const confirmDeleteRecipe = async () => {
    const recipeId = deleteConfirm.recipeId;
    setDeleteConfirm({ open: false, recipeId: null });

    try {
      await api.delete(`/api/recipes/${recipeId}`);
      toast.success("Recipe deleted successfully");
      if (onRecipeDeleted) onRecipeDeleted(recipeId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete recipe");
    }
  };

  return (
    <>
      <section className="recipe-grid">
        {data.map((item) => {
          const isOwner = user && item.ownerId && item.ownerId === user.id;

          return (
            <div
              key={item._id}
              className="recipe-card"
              onClick={() => setSelectedRecipe(item)}
            >
              <div className="image-card">
                <img
                  src={item.images?.[0] || item.image || recipeImage}
                  alt={item.recipeName || "Recipe"}
                  onLoad={applyAutoZoomForRatio}
                />
                <span className="time-badge">{item.timeRequired || item.time || "25-30 min"}</span>
              </div>

              <div className="name-card">
                <h3>{item.recipeName || item.title}</h3>

                <div className="card-right-actions" onClick={(e) => e.stopPropagation()}>
                  {/* Heart button */}
                  <button
                    className="heart-btn"
                    onClick={(e) => handleLikeClick(item, e)}
                    aria-label={likedItems[item._id] ? "Remove from favorites" : "Add to favorites"}
                  >
                    {likedItems[item._id] ? (
                      <IoMdHeart size={22} className="btn" color="red" />
                    ) : (
                      <IoMdHeartEmpty size={22} className="btn" />
                    )}
                  </button>

                  {/* Three-dots menu — owner only */}
                  {isOwner && (
                    <div
                      className="card-menu-wrap"
                      ref={openMenuId === item._id ? menuRef : null}
                    >
                      <button
                        className="card-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === item._id ? null : item._id);
                        }}
                        aria-label="More options"
                      >
                        <BsThreeDotsVertical size={17} />
                      </button>

                      {openMenuId === item._id && (
                        <div className="card-dropdown">
                          <button onClick={(e) => handleEditRecipe(e, item._id)}>
                            <MdEdit size={15} color="#15803d" /> Edit
                          </button>
                          <button
                            className="delete-opt"
                            onClick={(e) => handleDeleteClick(e, item._id)}
                          >
                            <MdDelete size={15} color="#dc2626" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <p className="created-at">Posted {formatCreatedTime(item.createdAt)}</p>
            </div>
          );
        })}

        {selectedRecipe && (
          <RecipeDetails
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
          />
        )}
      </section>

      {/* Remove from favorites confirmation */}
      <ConfirmDialog
        isOpen={removeConfirm.open}
        title="Remove from Favorites?"
        message="Are you sure you want to remove this recipe from your favorites?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmRemoveFavorite}
        onCancel={() => setRemoveConfirm({ open: false, item: null })}
      />

      {/* Delete recipe confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="Delete Recipe?"
        message="Are you sure you want to delete this recipe? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteRecipe}
        onCancel={() => setDeleteConfirm({ open: false, recipeId: null })}
      />
    </>
  );
};

export default Recipeitem;
