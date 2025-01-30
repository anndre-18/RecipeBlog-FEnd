import React from 'react';
//import './recipe-details.css'; // Separate CSS file for styling

const RecipeDetails = ({ recipe, onClose }) => {
  if (!recipe) return null; // Don't render if no recipe is selected

  
  return (
    <div className="recipe-details-overlay">
      <div className="recipe-details">
        <button className="close-btn" onClick={onClose}>✖</button>
        <img src={recipe.image} alt={recipe.title} />
        <h2>{recipe.title}</h2>
        <p><strong>Cooking Time:</strong> {recipe.time || "N/A"} minutes</p>
        <p><strong>Ingredients:</strong> {recipe.instruction || "No ingredients available."}</p>
        <p><strong>Instruction:</strong> {recipe.instruction || "No instruction available."}</p>
      </div>
    </div>
  );
};

export default RecipeDetails;
