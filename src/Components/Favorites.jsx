import React, { useState, useEffect } from 'react';
import { IoMdHeart } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import './header-home.css';

const Favorites = () => {
  const [favoriteItems, setFavoriteItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem("favorites")) || {};
    const savedRecipes = JSON.parse(localStorage.getItem("allRecipes")) || [];
    const favoriteRecipes = savedRecipes.filter((recipe) => savedFavorites[recipe.id]);
    setFavoriteItems(favoriteRecipes);
  }, []);

  return (
    <div className="favorites-container">
      <h1>My Favorite Recipes</h1>
      {favoriteItems.length === 0 ? (
        <p>No favorites yet.</p>
      ) : (
        <div className="recipe-grid">
          {favoriteItems.map((item) => (
            <div key={item.id} className="card" onClick={() => navigate(`/recipe/${item.id}`)}>
              <div className="image-card">
                <img src={item.image} alt={item.title} />
              </div>
              <div className="name-card">
                <h3>{item.title}</h3>
                <IoMdHeart size={24} className='btn' color='red' />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
