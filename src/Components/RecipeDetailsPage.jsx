import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "./ConfirmDialog";
import recipeImage from "./image.png";
import "./RecipeDetailsPage.css";

const RecipeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, updateUser } = useAuth();
  const { showToast } = useToast();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const galleryImages = useMemo(() => {
    if (!recipe) return [];
    if (Array.isArray(recipe.images) && recipe.images.length > 0) {
      return recipe.images;
    }
    return recipe.image ? [recipe.image] : [];
  }, [recipe]);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await api.get(`/api/recipes/${id}`);
        setRecipe(res.data);
      } catch {
        setError("Recipe not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!isAuthenticated || !id) return;
      try {
        const res = await api.get("/api/users/me/favoriteIds");
        setIsFavorite(res.data.includes(id));
      } catch (err) {
        console.error(err);
      }
    };

    fetchFavoriteStatus();
  }, [id, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      showToast("Please login to save favorites.", "error");
      return;
    }

    const wasFavorite = isFavorite;
    setIsFavorite(!wasFavorite);

    try {
      const response = await api.post("/api/favorites/toggle", { recipeId: id });
      const updatedFavorites = response.data.favorites;
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      updateUser({ ...storedUser, favorites: updatedFavorites });
      window.dispatchEvent(
        new CustomEvent("favoritesUpdated", {
          detail: { favorites: updatedFavorites },
        })
      );

      showToast(
        wasFavorite ? "Removed from favorites." : "Added to favorites.",
        "success"
      );
    } catch (err) {
      console.error(err);
      setIsFavorite(wasFavorite);
      showToast("Failed to update favorites.", "error");
    }
  };

  const handleFavoriteClick = () => {
    if (isFavorite) {
      setShowRemoveConfirm(true);
      return;
    }
    toggleFavorite();
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: recipe?.recipeName || "Recipe",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Recipe link copied to clipboard.", "success");
      }
    } catch {
      showToast("Unable to share recipe.", "error");
    }
  };

  if (loading) {
    return (
      <section className="recipe-details-page">
        <div className="recipe-details-page-loading">Loading recipe...</div>
      </section>
    );
  }

  if (error || !recipe) {
    return (
      <section className="recipe-details-page">
        <div className="recipe-details-page-error">
          <p>{error || "Recipe not found."}</p>
          <Link to="/">Back to Home</Link>
        </div>
      </section>
    );
  }

  const createdDate = recipe.createdAt
    ? new Date(recipe.createdAt).toLocaleDateString()
    : "N/A";

  return (
    <section className="recipe-details-page">
      <div className="recipe-details-page-container">
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="recipe-details-hero">
          <div className="recipe-details-main-image">
            <img
              src={galleryImages[activeImageIndex] || recipeImage}
              alt={recipe.recipeName}
            />
          </div>

          {galleryImages.length > 1 && (
            <div className="recipe-details-thumbs">
              {galleryImages.map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  type="button"
                  className={index === activeImageIndex ? "active" : ""}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={img} alt={`${recipe.recipeName} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="recipe-details-content">
          <div className="recipe-details-head">
            <div>
              <h1>{recipe.recipeName}</h1>
              <p className="recipe-meta">
                <span>⏱ {recipe.timeRequired}</span>
                <span>Posted {createdDate}</span>
              </p>
            </div>

            <div className="recipe-details-actions">
              <button type="button" className="action-btn" onClick={handleFavoriteClick}>
                {isFavorite ? (
                  <IoMdHeart size={22} color="red" />
                ) : (
                  <IoMdHeartEmpty size={22} />
                )}
                {isFavorite ? "Favorited" : "Favorite"}
              </button>
              <button type="button" className="action-btn" onClick={handleShare}>
                Share
              </button>
            </div>
          </div>

          <div className="recipe-section">
            <h2>Ingredients</h2>
            <p>{recipe.ingredients}</p>
          </div>

          <div className="recipe-section">
            <h2>Cooking Instructions</h2>
            <p>{recipe.description}</p>
          </div>
        </div>
      </div>

      {showRemoveConfirm && (
        <ConfirmDialog
          title="Remove from Favorites?"
          message="Are you sure you want to remove this recipe from your favorites?"
          confirmLabel="Remove"
          cancelLabel="Cancel"
          danger
          onCancel={() => setShowRemoveConfirm(false)}
          onConfirm={() => {
            setShowRemoveConfirm(false);
            toggleFavorite();
          }}
        />
      )}
    </section>
  );
};

export default RecipeDetailsPage;
