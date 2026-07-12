import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./RecipeDetails.css";

const RecipeDetails = ({ recipe, onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated, updateUser } = useAuth();
  const toast = useToast();

  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // ── All hooks BEFORE any early return ──────────────────────────────

  const galleryImages = useMemo(() => {
    if (!recipe) return [];
    if (Array.isArray(recipe.images) && recipe.images.length > 0) return recipe.images;
    return recipe.image ? [recipe.image] : [];
  }, [recipe]);

  useEffect(() => {
    if (!isAuthenticated || !recipe?.id) return;
    let cancelled = false;
    const fetchFav = async () => {
      try {
        const res = await api.get("/api/users/me/favoriteIds");
        if (!cancelled) setIsFavorited(res.data.includes(recipe.id));
      } catch {
        // ignore
      }
    };
    fetchFav();
    return () => { cancelled = true; };
  }, [isAuthenticated, recipe?.id]);

  // ── Early return after all hooks ────────────────────────────────────
  if (!recipe) return null;

  // ── Derived values ──────────────────────────────────────────────────
  const recipeTitle       = recipe.recipeName  || recipe.title       || "Recipe";
  const recipeTime        = recipe.timeRequired || recipe.time        || "N/A";
  const recipeDescription = recipe.description                        || "No description available.";
  const activeImage       = galleryImages[activeImageIndex];

  // ── Handlers ────────────────────────────────────────────────────────
  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info("Please login to save favorites.");
      return;
    }
    const prev = isFavorited;
    setIsFavorited(!prev);
    setFavoriteLoading(true);
    try {
      const res = await api.post("/api/favorites/toggle", { recipeId: recipe.id });
      const updatedFavorites = res.data.favorites;
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      updateUser({ ...storedUser, favorites: updatedFavorites });
      window.dispatchEvent(
        new CustomEvent("favoritesUpdated", { detail: { favorites: updatedFavorites } })
      );
      toast.success(prev ? "Removed from favorites" : "Added to favorites");
    } catch {
      setIsFavorited(prev);
      toast.error("Failed to update favorites");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleViewFullRecipe = () => {
    onClose();
    navigate(`/recipe/${recipe.id}`);
  };

  const showNext = () => {
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const showPrev = () => {
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div
      className="recipe-details-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={recipeTitle}
    >
      <div className="recipe-details" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          ✖
        </button>

        {activeImage && (
          <div className="details-gallery">
            <img src={activeImage} alt={recipeTitle} />
            {galleryImages.length > 1 && (
              <>
                <button type="button" className="gallery-nav prev" onClick={showPrev}>‹</button>
                <button type="button" className="gallery-nav next" onClick={showNext}>›</button>
                <div className="details-thumbs">
                  {galleryImages.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      className={`thumb-btn ${index === activeImageIndex ? "active" : ""}`}
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img src={img} alt={`${recipeTitle} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <h2>{recipeTitle}</h2>
        <p><strong>Cooking Time:</strong> {recipeTime}</p>
        <p><strong>Description:</strong> {recipeDescription}</p>

        <div className="details-action-bar">
          <button
            className={`popup-fav-btn ${isFavorited ? "active" : ""}`}
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorited ? <IoMdHeart size={18} /> : <IoMdHeartEmpty size={18} />}
            {isFavorited ? "Saved" : "Save"}
          </button>

          <button className="view-full-btn" onClick={handleViewFullRecipe}>
            View Full Recipe →
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails;
