import React, { useState, useEffect } from "react";
import { IoMdHeartEmpty, IoMdHeart } from "react-icons/io";
import RecipeDetails from "./RecipeDetails";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "./ConfirmDialog";
import "./Recipeitem.css";
import recipeImage from "./image.png";

const Recipeitem = ({ data, showRemoveConfirm = false, onFavoriteRemoved }) => {
  const { isAuthenticated, updateUser } = useAuth();
  const { showToast } = useToast();
  const [likedItems, setLikedItems] = useState({});
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [pendingUnfavorite, setPendingUnfavorite] = useState(null);

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

  useEffect(() => {
    const fetchFavoriteIds = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await api.get("/api/users/me/favoriteIds");
        const favoriteIds = response.data;
        const favoritesMap = {};
        favoriteIds.forEach((id) => {
          favoritesMap[id] = true;
        });
        setLikedItems(favoritesMap);
      } catch (error) {
        console.error("Failed to fetch favorite IDs:", error);
      }
    };
    fetchFavoriteIds();
  }, [isAuthenticated]);

  const performToggleFavorite = async (item, wasLiked) => {
    setLikedItems({ ...likedItems, [item.id]: !wasLiked });

    try {
      const response = await api.post("/api/favorites/toggle", {
        recipeId: item.id,
      });

      const updatedFavorites = response.data.favorites;
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      updateUser({ ...storedUser, favorites: updatedFavorites });
      window.dispatchEvent(
        new CustomEvent("favoritesUpdated", {
          detail: { favorites: updatedFavorites },
        })
      );

      if (wasLiked) {
        showToast("Recipe removed from favorites.", "success");
        onFavoriteRemoved?.(item.id);
      } else {
        showToast("Recipe added to favorites.", "success");
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      setLikedItems({ ...likedItems, [item.id]: wasLiked });
      showToast("Failed to update favorites.", "error");
    }
  };

  const handleLikeClick = async (item, e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast("Please login to save favorites.", "error");
      return;
    }

    const isLiked = likedItems[item.id];

    if (isLiked && showRemoveConfirm) {
      setPendingUnfavorite(item);
      return;
    }

    await performToggleFavorite(item, isLiked);
  };

  return (
    <section className="recipe-grid">
      {data.map((item) => (
        <div key={item.id} className="recipe-card" onClick={() => setSelectedRecipe(item)}>
          <div className="image-card">
            <img
              src={item.images?.[0] || item.image || recipeImage}
              alt="recipeimage"
            />
            <span className="time-badge">
              {item.timeRequired || item.time || "25-30 min"}
            </span>
          </div>
          <div className="name-card">
            <h3>{item.recipeName || item.title}</h3>
            <button onClick={(e) => handleLikeClick(item, e)}>
              {likedItems[item.id] ? (
                <IoMdHeart size={24} className="btn" color="red" />
              ) : (
                <IoMdHeartEmpty size={24} className="btn" />
              )}
            </button>
          </div>
          <p className="created-at">Posted {formatCreatedTime(item.createdAt)}</p>
        </div>
      ))}

      {selectedRecipe && (
        <RecipeDetails
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {pendingUnfavorite && (
        <ConfirmDialog
          title="Remove from Favorites?"
          message="Are you sure you want to remove this recipe from your favorites?"
          confirmLabel="Remove"
          cancelLabel="Cancel"
          danger
          onCancel={() => setPendingUnfavorite(null)}
          onConfirm={async () => {
            const item = pendingUnfavorite;
            setPendingUnfavorite(null);
            await performToggleFavorite(item, true);
          }}
        />
      )}
    </section>
  );
};

export default Recipeitem;
