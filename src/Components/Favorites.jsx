import React, { useState, useEffect } from 'react';
import Mealitem from './Mealitem';
import "./Favorites.css";

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFavorites = async () => {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                setLoading(false);
                setError("Please login to see your favorites.");
                return;
            }

            const user = JSON.parse(userStr);
            try {
                const response = await fetch(`http://localhost:3000/api/users/${user.id}/favorites`);
                if (response.ok) {
                    const data = await response.json();
                    setFavorites(data);
                } else {
                    setError("Failed to fetch favorite recipes.");
                }
            } catch (err) {
                console.error(err);
                setError("An error occurred while fetching favorites.");
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
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
                    <Mealitem data={favorites} />
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
