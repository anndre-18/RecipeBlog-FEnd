import React, { useMemo, useState } from 'react';
import "./RecipeDetails.css";

const RecipeDetails = ({ recipe, onClose }) => {
  if (!recipe) return null; // Don't render if no recipe is selected

  const galleryImages = useMemo(() => {
    if (Array.isArray(recipe.images) && recipe.images.length > 0) {
      return recipe.images;
    }
    return recipe.image ? [recipe.image] : [];
  }, [recipe.images, recipe.image]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const recipeTitle = recipe.recipeName || recipe.title || "Recipe";
  const recipeTime = recipe.timeRequired || recipe.time || "N/A";
  const recipeIngredients = recipe.ingredients || "No ingredients available.";
  const recipeDescription = recipe.description || recipe.instruction || "No instruction available.";
  const activeImage = galleryImages[activeImageIndex];

  const showNext = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const showPrev = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  
  return (
    <div className="recipe-details-overlay">
      <div className="recipe-details">
        <button className="close-btn" onClick={onClose}>✖</button>
        {activeImage ? (
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
        ) : null}
        <h2>{recipeTitle}</h2>
        <p><strong>Cooking Time:</strong> {recipeTime}</p>
        <p><strong>Ingredients:</strong> {recipeIngredients}</p>
        <p><strong>Instruction:</strong> {recipeDescription}</p>
      </div>
    </div>
  );
};

export default RecipeDetails;
