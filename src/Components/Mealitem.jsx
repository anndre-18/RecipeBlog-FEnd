import React, { useState } from 'react';
import { IoMdHeartEmpty, IoMdHeart } from "react-icons/io";
import RecipeDetails from './RecipeDetails'; // Import RecipeDetails component
import './header-home.css';
import recipeImage from './image.png';

const Mealitem = ({ data }) => {
  const [likedItems, setLikedItems] = useState({});
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const handleLikeClick = (id, e) => {
    e.stopPropagation(); // Prevent triggering the recipe details popup
    setLikedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className='recipe-grid'>
      <div className="recipe-card">
        {data.map((item, index) => {
          const itemId = item.id || index;
          return (
            <div key={itemId} className="card" onClick={() => setSelectedRecipe(item)}>
              <div className="image-card">
                <img src={recipeImage} alt="recipeimage" />
              </div>
              <div className="name-card">
                <h3>{item.title}</h3>
                <button onClick={(e) => handleLikeClick(itemId, e)}>
                  {likedItems[itemId] ? (
                    <IoMdHeart size={24} className='btn' color='red' />
                  ) : (
                    <IoMdHeartEmpty size={24} className='btn' />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show Recipe Details when a meal item is clicked */}
      {selectedRecipe && <RecipeDetails recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
    </section>
  );
};

export default Mealitem;
