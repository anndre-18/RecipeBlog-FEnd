import React, { useRef, useState } from "react";
import axios from "axios";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";
import { validateCookingTime } from "../utils/cookingTime";
import ImageCropper from "./ImageCropper";
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

const EMPTY_COOKING_TIME = { hours: "", minutes: "", seconds: "" };

const AddRecipe = () => {
  const toast = useToast();

  const [formData, setFormData] = useState({
    recipeName: "",
    servings: "",
    description: "",
    ingredients: "",
    instructions: "",
  });

  const [cookingTime, setCookingTime] = useState(EMPTY_COOKING_TIME);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const [cropQueue, setCropQueue] = useState([]);
  const [currentCrop, setCurrentCrop] = useState(null);

  // ── Helpers ─────────────────────────────────────────────────────────

  const applyAutoZoomForRatio = (event) => {
    const image = event.currentTarget;
    const ratio = image.naturalWidth / image.naturalHeight;
    const fitScale = ratio < 4 / 3 ? 1.18 : 1;
    image.style.setProperty("--fit-scale", String(fitScale));
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimeChange = (event) => {
    const { name, value } = event.target;
    // Allow only non-negative integers
    if (value !== "" && (!/^\d+$/.test(value) || Number(value) < 0)) return;
    setCookingTime((prev) => ({ ...prev, [name]: value }));
  };

  // ── Image handling ───────────────────────────────────────────────────

  const handleAddImageClick = () => {
    if (selectedImages.length >= MAX_IMAGES) return;
    fileInputRef.current?.click();
  };

  const handleImageSelect = (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (incomingFiles.length === 0) return;

    const remaining = MAX_IMAGES - selectedImages.length;
    if (remaining <= 0) {
      toast.error("Maximum 3 images are allowed.");
      event.target.value = "";
      return;
    }

    const filesToAdd = incomingFiles.slice(0, remaining);
    if (incomingFiles.length > remaining) {
      toast.info("Only 3 images are allowed. Extra files were ignored.");
    }

    const queued = filesToAdd.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      file,
      rawUrl: URL.createObjectURL(file),
    }));

    setCurrentCrop(queued[0]);
    if (queued.length > 1) setCropQueue(queued.slice(1));
    event.target.value = "";
  };

  const handleCropConfirm = (blob) => {
    const previewUrl = URL.createObjectURL(blob);
    const croppedEntry = {
      id: currentCrop.id,
      file: new File([blob], "cropped.jpg", { type: "image/jpeg" }),
      previewUrl,
    };
    URL.revokeObjectURL(currentCrop.rawUrl);
    setSelectedImages((prev) => [...prev, croppedEntry]);

    if (cropQueue.length > 0) {
      setCurrentCrop(cropQueue[0]);
      setCropQueue((prev) => prev.slice(1));
    } else {
      setCurrentCrop(null);
    }
  };

  const handleCropCancel = () => {
    URL.revokeObjectURL(currentCrop.rawUrl);
    cropQueue.forEach((item) => URL.revokeObjectURL(item.rawUrl));
    setCropQueue([]);
    setCurrentCrop(null);
  };

  const handleRemoveImage = (id) => {
    setSelectedImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  // ── Upload ───────────────────────────────────────────────────────────

  const uploadImageToCloudinary = async (file) => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.secure_url;
  };

  // ── Validation ───────────────────────────────────────────────────────

  const validateForm = () => {
    const { recipeName, servings, description, ingredients, instructions } = formData;

    if (!recipeName.trim()) return "Recipe name is required.";
    if (!description.trim()) return "Description is required.";
    if (!ingredients.trim()) return "Ingredients are required.";
    if (!instructions.trim()) return "Instructions are required.";

    const servingsNum = Number(servings);
    if (!servings || isNaN(servingsNum) || servingsNum < 1 || !Number.isInteger(servingsNum)) {
      return "Servings must be a positive whole number (e.g. 2, 4, 6).";
    }

    const timeError = validateCookingTime(cookingTime);
    if (timeError) return timeError;

    if (selectedImages.length < 1) return "At least 1 image is required.";
    if (selectedImages.length > MAX_IMAGES) return "Maximum 3 images are allowed.";

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      return "Cloudinary config missing. Check your .env file.";
    }
    return "";
  };

  const resetForm = () => {
    setFormData({ recipeName: "", servings: "", description: "", ingredients: "", instructions: "" });
    setCookingTime(EMPTY_COOKING_TIME);
    setSelectedImages((prev) => {
      prev.forEach((img) => { if (img.previewUrl) URL.revokeObjectURL(img.previewUrl); });
      return [];
    });
  };

  // ── Submit ───────────────────────────────────────────────────────────

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) { toast.error(validationError); return; }

    setIsSubmitting(true);
    try {
      const urls = await Promise.all(
        selectedImages.map((image) => uploadImageToCloudinary(image.file))
      );

      const ct = {
        hours: Number(cookingTime.hours) || 0,
        minutes: Number(cookingTime.minutes) || 0,
        seconds: Number(cookingTime.seconds) || 0,
      };

      await api.post("/api/recipes", {
        recipeName: formData.recipeName.trim(),
        cookingTime: ct,
        servings: Number(formData.servings),
        description: formData.description.trim(),
        ingredients: formData.ingredients.trim(),
        instructions: formData.instructions.trim(),
        images: urls,
        createdAt: new Date(),
      });

      toast.success("Recipe created successfully!");
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create recipe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Image button label ───────────────────────────────────────────────
  const imageCount = selectedImages.length;
  const imageLimitReached = imageCount >= MAX_IMAGES;
  const imageButtonLabel = imageLimitReached
    ? `Maximum limit reached (${imageCount}/${MAX_IMAGES})`
    : `Add Image${imageCount > 0 ? ` (${imageCount}/${MAX_IMAGES})` : ""}`;

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <>
      <section className="add-recipe-page">
        <div className="add-recipe-container">

          {/* ── Left: images ── */}
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
                        <img
                          src={image.previewUrl}
                          alt="Recipe preview"
                          onLoad={applyAutoZoomForRatio}
                        />
                      </div>
                      <button type="button" onClick={() => handleRemoveImage(image.id)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="image-limit-note">
              {imageLimitReached
                ? `✓ Maximum 3 images added.`
                : `${imageCount} of ${MAX_IMAGES} images added — maximum 3 allowed.`}
            </p>

            <div className="dots-row" aria-label="selected images indicator">
              {Array.from({ length: MAX_IMAGES }).map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index < imageCount ? "active" : ""}`}
                />
              ))}
            </div>

            <button
              className={`add-image-button ${imageLimitReached ? "limit-reached" : ""}`}
              type="button"
              onClick={handleAddImageClick}
              disabled={imageLimitReached}
            >
              {imageButtonLabel}
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

          {/* ── Right: form ── */}
          <div className="add-recipe-right">
            <h2>Write Recipe</h2>
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

              {/* Cooking Time */}
              <div className="form-group-label">Cooking Time</div>
              <div className="cooking-time-row">
                <div className="time-unit">
                  <input
                    type="number"
                    name="hours"
                    value={cookingTime.hours}
                    onChange={handleTimeChange}
                    min="0"
                    placeholder="0"
                  />
                  <span className="time-unit-label">hrs</span>
                </div>
                <div className="time-unit">
                  <input
                    type="number"
                    name="minutes"
                    value={cookingTime.minutes}
                    onChange={handleTimeChange}
                    min="0"
                    max="59"
                    placeholder="0"
                  />
                  <span className="time-unit-label">min</span>
                </div>
                <div className="time-unit">
                  <input
                    type="number"
                    name="seconds"
                    value={cookingTime.seconds}
                    onChange={handleTimeChange}
                    min="0"
                    max="59"
                    placeholder="0"
                  />
                  <span className="time-unit-label">sec</span>
                </div>
              </div>

              {/* Servings */}
              <label>
                Servings
                <input
                  type="number"
                  name="servings"
                  value={formData.servings}
                  onChange={handleFieldChange}
                  min="1"
                  step="1"
                  placeholder="e.g. 4"
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFieldChange}
                  rows={3}
                  placeholder="Brief description of the recipe..."
                />
              </label>

              <label>
                Ingredients
                <textarea
                  name="ingredients"
                  value={formData.ingredients}
                  onChange={handleFieldChange}
                  rows={4}
                  placeholder="List ingredients separated by new lines..."
                />
              </label>

              <label>
                Instructions
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleFieldChange}
                  rows={5}
                  placeholder="Write the step-by-step cooking instructions..."
                />
              </label>

              <button
                className="create-post-button"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Publishing..." : "Publish Recipe"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {currentCrop && (
        <ImageCropper
          imageSrc={currentCrop.rawUrl}
          aspect={4 / 3}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  );
};

export default AddRecipe;
