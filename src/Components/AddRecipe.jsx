import React, { useState } from 'react';
import axios from 'axios';


const AddRecipe = () => {
  const [formData, setFormData] = useState({
    title: '',
    ingredients: '',
    instruction: '',
    time: '',
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { title, ingredients, instruction, time } = formData;

    // Check if all fields are filled
    if (!title || !ingredients || !instruction || !time) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      // Make the API request to add the recipe
      const response = await axios.post('http://localhost:3000/api/recipes', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Log the success message and the details of the newly added recipe to the console
      console.log('Recipe added successfully:', response.data);

      setSuccessMessage('Recipe added successfully!');
      setFormData({
        title: '',
        ingredients: '',
        instruction: '',
        time: '',
      });
      setError('');
    } catch (err) {
      setError('There was an error adding the recipe.');
      console.error(err);
    }
  };

  return (
    <div className="recipe-content">
      <h1>Add a New Recipe</h1>

      {/* Display error and success messages */}
      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

      {/* Recipe Form */}
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-input">
          <label>Title</label>
          <input
            className="input"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-input">
          <label>Ingredients</label>
          <textarea
            className="input"
            name="ingredients"
            value={formData.ingredients}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-input">
          <label>Instructions</label>
          <textarea
            className="input"
            name="instruction"
            value={formData.instruction}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-input">
          <label>Time</label>
          <input
            className="input"
            type='number'
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
          />
        </div>
        <button className="submit-button" type="submit">Add Recipe</button>
      </form>
    </div>
  );
};

export default AddRecipe;
