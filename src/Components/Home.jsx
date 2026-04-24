import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Mealitem from './Mealitem';
import "./Home.css";

const Home = () => {
  const [items, setItems] = useState([]); // Stores the recipes
  const [search, setSearch] = useState(""); // State for search input
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchRecipes = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/recipes`
      );

      setItems(res.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch recipes.");
    } finally {
      setLoading(false);
    }
  };

  fetchRecipes();
}, []);


   const scrollTosearch = () => {
  const section = document.getElementById("search");
  section?.scrollIntoView({ behavior: "smooth" });
};


  // Filter recipes based on search input
  const filteredItems = items.filter((item) =>
    (item.recipeName || item.title || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

 
  return (
    <div className="home-content">
      <div className="hero-section">
        
        <div className="hero-content">
          <div className="hero-text-content">
            <h1 className="hero-title">Discover & Share Amazing Recipes</h1>
            <p className="hero-subtitle">Join our community of food lovers</p>
            <div className="hero-buttons">
              <button className="hero-btn main-btn" onClick={scrollTosearch}>Explore recipes</button>
              <button className="hero-btn secondary-btn">Create post</button>
            </div>
          </div>
          <img src="/assets/hero_page_img.png" alt="plates" className="hero-image" />
        </div>

      </div>

      <section  id='search'>
        {/* <p>nothing</p> */}
          {/* <div className="search-content"> */}
            <h1 className="s-title">Search for Recipes</h1>
            <input
              type="text"
              className="search-box"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          {/* </div> */}
        
      </section>

      

      <div className="container">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>{error}</p>
        ) : filteredItems.length > 0 ? (
          <Mealitem data={filteredItems} />
        ) : (
          <p>No recipes found</p>
        )}
      </div>
    </div>
  );
};

export default Home;
