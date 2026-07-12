import React, { useState, useEffect } from "react";
import Recipeitem from "./Recipeitem";
import api from "../utils/api";
import "./Favorites.css";

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/users/me/favorites");
      setFavorites(response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching favorites.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Listen for favorites updates (from toggle in Recipeitem)
  useEffect(() => {
    const handleFavoritesUpdated = () => {
      fetchFavorites();
    };
    window.addEventListener("favoritesUpdated", handleFavoritesUpdated);
    return () => window.removeEventListener("favoritesUpdated", handleFavoritesUpdated);
  }, []);

  return (
    <div className="fav-content">
      <div className="fav-hero">
        <h1 className="fav-title">Your Favorite Recipes</h1>
        <p className="fav-subtitle">Recipes you've loved and saved for later</p>
      </div>

      <div className="container fav-container">
        {loading ? (
          <p className="fav-message">Loading favorites...</p>
        ) : error ? (
          <p className="fav-message fav-error">{error}</p>
        ) : favorites.length > 0 ? (
          <Recipeitem data={favorites} onRecipeDeleted={() => fetchFavorites()} />
        ) : (
          <div className="fav-empty">
            <p>You haven't added any favorite recipes yet.</p>
            <p>Explore the home page and click the heart icon to save recipes!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
