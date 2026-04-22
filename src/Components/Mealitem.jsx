// import React, { useState } from 'react';
// import { IoMdHeartEmpty, IoMdHeart } from "react-icons/io";
// import RecipeDetails from './RecipeDetails'; // Import RecipeDetails component
// import './header-home.css';
// import recipeImage from './image.png';

// const Mealitem = ({ data }) => {
//   const [likedItems, setLikedItems] = useState({});
//   const [selectedRecipe, setSelectedRecipe] = useState(null);

//   const handleLikeClick = (id, e) => {
//     e.stopPropagation(); // Prevent triggering the recipe details popup
//     setLikedItems(prev => ({ ...prev, [id]: !prev[id] }));
//   };


//   return (
//     <section className='recipe-grid'>
//       <div className="recipe-card">
//         {data.map((item, index) => {
//           const itemId = item.id || index;
//           return (
//             <div key={itemId} className="card" onClick={() => setSelectedRecipe(item)}>
//               <div className="image-card">
//                 <img src={recipeImage} alt="recipeimage" />
//               </div>
//               <div className="name-card">
//                 <h3>{item.title}</h3>
//                 <button onClick={(e) => handleLikeClick(itemId, e)}>
//                   {likedItems[itemId] ? (
//                     <IoMdHeart size={24} className='btn' color='red' />
//                   ) : (
//                     <IoMdHeartEmpty size={24} className='btn' />
//                   )}
//                 </button>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Show Recipe Details when a meal item is clicked */}
//       {selectedRecipe && <RecipeDetails recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
//     </section>
//   );
// };

// export default Mealitem;


import React, { useState, useEffect } from 'react';
import { IoMdHeartEmpty, IoMdHeart } from "react-icons/io";
import RecipeDetails from './RecipeDetails'; 
import "./Mealitem.css";
import recipeImage from './image.png';

const Mealitem = ({ data }) => {
  const [likedItems, setLikedItems] = useState({});
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const applyAutoZoomForRatio = (event) => {
    const image = event.currentTarget;
    const ratio = image.naturalWidth / image.naturalHeight;
    const targetRatio = 4 / 3;
    const fitScale = ratio < targetRatio ? 1.18 : 1;
    image.style.setProperty("--fit-scale", String(fitScale));
  };

  const formatCreatedTime = (value) => {
    if (!value) return "Just now";
    const created = new Date(value);
    if (Number.isNaN(created.getTime())) return "Just now";

    const now = new Date();
    const diffMs = now - created;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))} min ago`;
    if (diffMs < day) return `${Math.floor(diffMs / hour)} hr ago`;
    if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} day ago`;
    return created.toLocaleDateString();
  };

  // Load favorites from the DB if user is logged in
  useEffect(() => {
    const fetchFavoriteIds = async () => {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const response = await fetch(`http://localhost:3000/api/users/${user.id}/favoriteIds`);
          if (response.ok) {
            const favoriteIds = await response.json();
            const favoritesMap = {};
            favoriteIds.forEach(id => { favoritesMap[id] = true; });
            setLikedItems(favoritesMap);
          }
        } catch (error) {
          console.error("Failed to fetch favorite IDs:", error);
        }
      }
    };
    fetchFavoriteIds();
  }, []);

  // Toggle favorite and update via database API
  const handleLikeClick = async (item, e) => {
    e.stopPropagation(); // Prevent triggering the recipe details popup

    const userStr = localStorage.getItem("user");
    if (!userStr) {
        alert("Please login to save favorites.");
        return;
    }
    const user = JSON.parse(userStr);

    const isLiked = likedItems[item.id];
    // Optimistic UI update
    setLikedItems({ ...likedItems, [item.id]: !isLiked });

    try {
        const response = await fetch("http://localhost:3000/api/favorites/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, recipeId: item.id })
        });
        if (!response.ok) {
            // Revert optimisic update if request failed
            setLikedItems({ ...likedItems, [item.id]: isLiked });
        }
    } catch (error) {
        console.error("Failed to toggle favorite:", error);
        // Revert on error
        setLikedItems({ ...likedItems, [item.id]: isLiked });
    }
  };

  return (
    <section className="recipe-grid">
      <div className="recipe-card">
        {data.map((item) => (
          <div key={item.id} className="card" onClick={() => setSelectedRecipe(item)}>
            <div className="image-card">
              <img
                src={item.images?.[0] || item.image || recipeImage}
                alt="recipeimage"
                onLoad={applyAutoZoomForRatio}
              />
              <span className="time-badge">{item.timeRequired || item.time || "25-30 min"}</span>
            </div>
            <div className="card-content">
              <div className="name-card">
                <h3>{item.recipeName || item.title}</h3>
                <button onClick={(e) => handleLikeClick(item, e)}>
                {likedItems[item.id] ? (
                  <IoMdHeart size={24} className='btn' color='red' />
                ) : (
                  <IoMdHeartEmpty size={24} className='btn' />
                )}
                </button>
              </div>
              {/* <div className="meta-row">
                <span className="rating">★ {item.rating || "4.7"}</span>
                <span className="category">{item.category || "Deli · Bagels"}</span>
                <span className="price">{item.priceRange || "$$"}</span>
              </div> */}
              <p className="created-at">Posted {formatCreatedTime(item.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Show Recipe Details when a meal item is clicked */}
      {selectedRecipe && <RecipeDetails recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
    </section>
  );
};

export default Mealitem;
