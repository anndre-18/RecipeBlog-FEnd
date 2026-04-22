import React, { useRef, useState } from "react";
import axios from "axios";
import "./add-recipe.css";

const MAX_IMAGES = 3;
const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
  import.meta.env.VITE_CLOUDINARY_NAME ||
  "";
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
  import.meta.env.VITE_CLOUDINARY_PRESET ||
  "";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const AddRecipe = () => {
  const [formData, setFormData] = useState({
    recipeName: "",
    timeRequired: "",
    ingredients: "",
    description: "",
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const applyAutoZoomForRatio = (event) => {
    const image = event.currentTarget;
    const ratio = image.naturalWidth / image.naturalHeight;
    const targetRatio = 4 / 3;
    const fitScale = ratio < targetRatio ? 1.18 : 1;
    image.style.setProperty("--fit-scale", String(fitScale));
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (incomingFiles.length === 0) return;

    const currentCount = selectedImages.length;
    const remainingSlots = MAX_IMAGES - currentCount;

    if (remainingSlots <= 0) {
      setErrorMessage("Maximum 3 images are allowed.");
      event.target.value = "";
      return;
    }

    const filesToAdd = incomingFiles.slice(0, remainingSlots);
    const mappedFiles = filesToAdd.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedImages((prev) => [...prev, ...mappedFiles]);
    setErrorMessage(
      incomingFiles.length > remainingSlots
        ? "Only 3 images are allowed. Extra files were ignored."
        : ""
    );
    event.target.value = "";
  };

  const handleRemoveImage = (id) => {
    setSelectedImages((prev) => {
      const imageToRemove = prev.find((image) => image.id === id);
      if (imageToRemove?.previewUrl) URL.revokeObjectURL(imageToRemove.previewUrl);
      return prev.filter((image) => image.id !== id);
    });
    setErrorMessage("");
  };

  const uploadImageToCloudinary = async (file) => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const response = await axios.post(uploadUrl, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.secure_url;
  };

  const validateForm = () => {
    const { recipeName, timeRequired, ingredients, description } = formData;
    if (!recipeName.trim() || !timeRequired.toString().trim() || !ingredients.trim() || !description.trim()) {
      return "All fields are required.";
    }
    if (selectedImages.length < 1) {
      return "At least 1 image is required.";
    }
    if (selectedImages.length > MAX_IMAGES) {
      return "Maximum 3 images are allowed.";
    }
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      return "Cloudinary config missing. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in recipeapp/.env";
    }
    return "";
  };

  const resetForm = () => {
    setFormData({
      recipeName: "",
      timeRequired: "",
      ingredients: "",
      description: "",
    });
    setSelectedImages((prev) => {
      prev.forEach((image) => {
        if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
      });
      return [];
    });
    setUploadedImageUrls([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const urls = await Promise.all(selectedImages.map((image) => uploadImageToCloudinary(image.file)));
      setUploadedImageUrls(urls);

      const postPayload = {
        recipeName: formData.recipeName.trim(),
        timeRequired: formData.timeRequired.toString().trim(),
        ingredients: formData.ingredients.trim(),
        description: formData.description.trim(),
        images: urls,
        createdAt: new Date(),
      };

      await axios.post(`${API_BASE_URL}/api/recipes`, postPayload, {
        headers: { "Content-Type": "application/json" },
      });

      setSuccessMessage("Recipe post created successfully.");
      resetForm();
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="add-recipe-page">
      <div className="add-recipe-container">
        <div className="add-recipe-left">
          <h2>Upload Images</h2>
          <div className="image-frame">
            {selectedImages.length === 0 ? (
              <p className="image-placeholder">Select 1 to 3 recipe images</p>
            ) : (
              <div className="preview-grid">
                {selectedImages.map((image) => (
                  <div className="preview-card" key={image.id}>
                    <div className="preview-media">
                      <img src={image.previewUrl} alt="Recipe preview" onLoad={applyAutoZoomForRatio} />
                    </div>
                    <button type="button" onClick={() => handleRemoveImage(image.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="ratio-note">Preview ratio locked to 4:3 for consistent cards.</p>

          <div className="dots-row" aria-label="selected images indicator">
            {Array.from({ length: MAX_IMAGES }).map((_, index) => (
              <span key={index} className={`dot ${index < selectedImages.length ? "active" : ""}`} />
            ))}
          </div>

          <button className="add-image-button" type="button" onClick={handleAddImageClick}>
            Add Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleImageSelect}
          />
        </div>

        <div className="vertical-divider" />

        <div className="add-recipe-right">
          <h2>Write Recipe </h2>
          <form className="recipe-form" onSubmit={handleSubmit}>
            <label>
              Recipe Name
              <input
                type="text"
                name="recipeName"
                value={formData.recipeName}
                onChange={handleFieldChange}
                placeholder="e.g. Creamy Garlic Pasta"
              />
            </label>

            <label>
              Time Required
              <input
                type="text"
                name="timeRequired"
                value={formData.timeRequired}
                onChange={handleFieldChange}
                placeholder="e.g. 30 minutes"
              />
            </label>

            <label>
              Ingredients
              <textarea
                name="ingredients"
                value={formData.ingredients}
                onChange={handleFieldChange}
                rows={4}
                placeholder="List ingredients..."
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFieldChange}
                rows={5}
                placeholder="Write the recipe steps..."
              />
            </label>

            <button className="create-post-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Post"}
            </button>
          </form>

          {!!errorMessage && <p className="form-message error">{errorMessage}</p>}
          {!!successMessage && <p className="form-message success">{successMessage}</p>}
          {uploadedImageUrls.length > 0 && (
            <p className="uploaded-count">Uploaded images: {uploadedImageUrls.length}</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default AddRecipe;
