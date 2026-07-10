import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import "./RecipeDetails.css";

const RecipeDetails = ({ recipe, onClose }) => {
  const navigate = useNavigate();

  if (!recipe) return null;

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
  const recipeDescription =
    recipe.description || recipe.instruction || "No instruction available.";
  const activeImage = galleryImages[activeImageIndex];

  const showNext = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const showPrev = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIndex(
      (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
    );
  };

  const handleViewFull = () => {
    onClose();
    navigate(`/recipe/${recipe.id}`);
  };

  return (
    <div className="recipe-details-overlay">
      <div className="recipe-details">
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
        {activeImage ? (
          <div className="details-gallery">
            <div className="details-image-frame">
              <img src={activeImage} alt={recipeTitle} />
            </div>
            {galleryImages.length > 1 && (
              <>
                <button type="button" className="gallery-nav prev" onClick={showPrev}>
                  ‹
                </button>
                <button type="button" className="gallery-nav next" onClick={showNext}>
                  ›
                </button>
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
        <p>
          <strong>Cooking Time:</strong> {recipeTime}
        </p>
        <p>
          <strong>Ingredients:</strong> {recipeIngredients}
        </p>
        <p>
          <strong>Instruction:</strong> {recipeDescription}
        </p>

        <button type="button" className="view-full-recipe-btn" onClick={handleViewFull}>
          View Full Recipe
        </button>
      </div>
    </div>
  );
};

export default RecipeDetails;
