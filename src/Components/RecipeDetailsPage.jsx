import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { IoShareSocialOutline, IoArrowBack } from "react-icons/io5";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./RecipeDetailsPage.css";

const RecipeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, updateUser } = useAuth();
  const toast = useToast();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await api.get(`/api/recipes/${id}`);
        setRecipe(res.data);
      } catch (err) {
        console.error(err);
        setError("Recipe not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchFavoriteIds = async () => {
      try {
        const res = await api.get("/api/users/me/favoriteIds");
        setIsFavorited(res.data.includes(id));
      } catch (err) {
        console.error("Failed to fetch favorite status:", err);
      }
    };
    fetchFavoriteIds();
  }, [id, isAuthenticated]);

  const galleryImages = useMemo(() => {
    if (!recipe) return [];
    if (Array.isArray(recipe.images) && recipe.images.length > 0) return recipe.images;
    return recipe.image ? [recipe.image] : [];
  }, [recipe]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.info("Please login to save favorites.");
      return;
    }

    const prev = isFavorited;
    setIsFavorited(!prev);
    setFavoriteLoading(true);

    try {
      const res = await api.post("/api/favorites/toggle", { recipeId: id });
      const updatedFavorites = res.data.favorites;
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      updateUser({ ...storedUser, favorites: updatedFavorites });
      window.dispatchEvent(
        new CustomEvent("favoritesUpdated", { detail: { favorites: updatedFavorites } })
      );
      toast.success(prev ? "Removed from favorites" : "Added to favorites");
    } catch (err) {
      console.error(err);
      setIsFavorited(prev);
      toast.error("Failed to update favorites");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: recipe?.recipeName, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const formatDate = (value) => {
    if (!value) return "Unknown";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "Unknown" : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="rdp-loading">
        <div className="rdp-spinner" />
        <p>Loading recipe…</p>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="rdp-error">
        <p>{error || "Recipe not found."}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const recipeTitle = recipe.recipeName || recipe.title || "Recipe";
  const recipeTime = recipe.timeRequired || recipe.time || "N/A";
  const recipeIngredients = recipe.ingredients || "No ingredients listed.";
  const recipeInstructions = recipe.instructions || "";
  const recipeDescription = recipe.description || "No description available.";
  const activeImage = galleryImages[activeImageIndex];

  return (
    <div className="rdp-page">
      {/* Back button */}
      <button className="rdp-back" onClick={() => navigate(-1)} aria-label="Go back">
        <IoArrowBack size={20} />
        Back
      </button>

      <div className="rdp-layout">
        {/* ── Left: image gallery ── */}
        <div className="rdp-gallery-col">
          {activeImage ? (
            <>
              <div className="rdp-main-image">
                <img src={activeImage} alt={recipeTitle} />
                {galleryImages.length > 1 && (
                  <>
                    <button
                      className="rdp-nav prev"
                      onClick={() =>
                        setActiveImageIndex(
                          (i) => (i - 1 + galleryImages.length) % galleryImages.length
                        )
                      }
                    >
                      ‹
                    </button>
                    <button
                      className="rdp-nav next"
                      onClick={() =>
                        setActiveImageIndex((i) => (i + 1) % galleryImages.length)
                      }
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {galleryImages.length > 1 && (
                <div className="rdp-thumbs">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      className={`rdp-thumb ${idx === activeImageIndex ? "active" : ""}`}
                      onClick={() => setActiveImageIndex(idx)}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <img src={img} alt={`${recipeTitle} ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="rdp-no-image">No image available</div>
          )}

          {/* Action buttons below gallery */}
          <div className="rdp-actions">
            <button
              className={`rdp-fav-btn ${isFavorited ? "active" : ""}`}
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorited ? (
                <IoMdHeart size={20} />
              ) : (
                <IoMdHeartEmpty size={20} />
              )}
              {isFavorited ? "Saved" : "Save Recipe"}
            </button>

            <button className="rdp-share-btn" onClick={handleShare} aria-label="Share recipe">
              <IoShareSocialOutline size={20} />
              Share
            </button>
          </div>
        </div>

        {/* ── Right: recipe info ── */}
        <div className="rdp-info-col">
          <h1 className="rdp-title">{recipeTitle}</h1>

          <div className="rdp-meta">
            <div className="rdp-meta-item">
              <span className="rdp-meta-label">Cooking Time</span>
              <span className="rdp-meta-value">⏱ {recipeTime}</span>
            </div>
            {recipe.ownerName && (
              <div className="rdp-meta-item">
                <span className="rdp-meta-label">Created by</span>
                <span className="rdp-meta-value">👤 {recipe.ownerName}</span>
              </div>
            )}
            <div className="rdp-meta-item">
              <span className="rdp-meta-label">Posted</span>
              <span className="rdp-meta-value">📅 {formatDate(recipe.createdAt)}</span>
            </div>
          </div>

          <div className="rdp-section">
            <h2>Ingredients</h2>
            <div className="rdp-ingredients">
              {recipeIngredients.split("\n").filter(Boolean).map((line, i) => (
                <div key={i} className="rdp-ingredient-item">
                  <span className="rdp-bullet" />
                  <span>{line.trim()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rdp-section">
            <h2>Instructions</h2>
            {recipeInstructions ? (
              <div className="rdp-instructions">
                {recipeInstructions.split("\n").filter(Boolean).map((step, i) => (
                  <div key={i} className="rdp-step">
                    <span className="rdp-step-num">{i + 1}</span>
                    <p>{step.trim()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rdp-fallback">Instructions not available.</p>
            )}
          </div>

          <div className="rdp-section">
            <h2>Description</h2>
            <p className="rdp-description">{recipeDescription}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailsPage;
