import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Mealitem from './Mealitem';
import './header-home.css';

const Home = () => {
  const [items, setItems] = useState([]); // Stores the recipes
  const [search, setSearch] = useState(""); // State for search input
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        //const res = await axios.get("http://localhost:3000/api/recipes");
        const res = await axios.get("https://recipeblog-bend.onrender.com/api/recipes");

        setItems(res.data || []); // Ensure it's always an array
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch recipes.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  // Filter recipes based on search input
  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="home-content">
      <section className="search">
        <h1 className="s-title">Search for Recipes</h1>
        <input
          type="text"
          className="search-box"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
