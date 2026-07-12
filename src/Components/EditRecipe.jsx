import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import axios from "axios";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ImageCropper from "./ImageCropper";
import "./add-recipe.css";
import "./EditRecipe.css";

const MAX_IMAGES = 3;
const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
  import.meta.env.VITE_CLOUDINARY_NAME ||
  "";
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
  import.meta.env.VITE_CLOUDINARY_PRESET ||
  "";

const EditRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    recipeName: "",
    timeRequired: "",
    ingredients: "",
    instructions: "",
    description: "",
  });

  // Mix of existing URLs (strings) and new cropped images (File objects with previewUrl)
  const [imageSlots, setImageSlots] = useState([]); // { type: 'existing'|'new', url?, file?, previewUrl?, id }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingRecipe, setLoadingRecipe] = useState(true);

  // Cropper state
  const [cropQueue, setCropQueue] = useState([]);
  const [currentCrop, setCurrentCrop] = useState(null);

  const fileInputRef = useRef(null);

  // Load the existing recipe
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await api.get(`/api/recipes/${id}`);
        const recipe = res.data;

        // Authorization check on the frontend too
        if (recipe.ownerId !== user?.id) {
          toast.error("You are not authorized to edit this recipe.");
          navigate("/");
          return;
        }

        setFormData({
          recipeName: recipe.recipeName || "",
          timeRequired: recipe.timeRequired || "",
          ingredients: recipe.ingredients || "",
          instructions: recipe.instructions || "",
          description: recipe.description || "",
        });

        // Convert existing image URLs to slots
        const existingSlots = (recipe.images || []).map((url, i) => ({
          id: `existing-${i}-${url}`,
          type: "existing",
          url,
          previewUrl: url,
        }));
        setImageSlots(existingSlots);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load recipe.");
        navigate("/");
      } finally {
        setLoadingRecipe(false);
      }
    };

    if (user) fetchRecipe();
  }, [id, user, navigate, toast]);

  const applyAutoZoomForRatio = (event) => {
    const image = event.currentTarget;
    const ratio = image.naturalWidth / image.naturalHeight;
    const fitScale = ratio < 4 / 3 ? 1.18 : 1;
    image.style.setProperty("--fit-scale", String(fitScale));
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (e) => {
    const incomingFiles = Array.from(e.target.files || []);
    if (incomingFiles.length === 0) return;

    const remaining = MAX_IMAGES - imageSlots.length;
    if (remaining <= 0) {
      toast.error("Maximum 3 images are allowed.");
      e.target.value = "";
      return;
    }

    const filesToAdd = incomingFiles.slice(0, remaining);
    if (incomingFiles.length > remaining) toast.info("Only 3 images are allowed. Extra files ignored.");

    const queued = filesToAdd.map((file) => ({
      id: `new-${file.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      file,
      rawUrl: URL.createObjectURL(file),
    }));

    setCurrentCrop(queued[0]);
    if (queued.length > 1) setCropQueue(queued.slice(1));
    e.target.value = "";
  };

  const handleCropConfirm = (blob) => {
    const previewUrl = URL.createObjectURL(blob);
    const newSlot = {
      id: currentCrop.id,
      type: "new",
      file: new File([blob], "cropped.jpg", { type: "image/jpeg" }),
      previewUrl,
    };
    URL.revokeObjectURL(currentCrop.rawUrl);
    setImageSlots((prev) => [...prev, newSlot]);

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

  const handleRemoveImage = (slotId) => {
    setImageSlots((prev) => {
      const slot = prev.find((s) => s.id === slotId);
      if (slot?.type === "new" && slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
      return prev.filter((s) => s.id !== slotId);
    });
  };

  const uploadImageToCloudinary = async (file) => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.secure_url;
  };

  const validateForm = () => {
    const { recipeName, timeRequired, ingredients, instructions, description } = formData;
    if (!recipeName.trim() || !timeRequired.trim() || !ingredients.trim() || !instructions.trim() || !description.trim()) {
      return "All fields are required.";
    }
    if (imageSlots.length < 1) return "At least 1 image is required.";
    if (imageSlots.length > MAX_IMAGES) return "Maximum 3 images are allowed.";
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      return "Cloudinary config is missing. Check your .env file.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { toast.error(err); return; }

    setIsSubmitting(true);
    try {
      // Upload new images; keep existing URLs as-is
      const imageUrls = await Promise.all(
        imageSlots.map((slot) =>
          slot.type === "existing"
            ? Promise.resolve(slot.url)
            : uploadImageToCloudinary(slot.file)
        )
      );

      await api.put(`/api/recipes/${id}`, {
        recipeName: formData.recipeName.trim(),
        timeRequired: formData.timeRequired.trim(),
        ingredients: formData.ingredients.trim(),
        instructions: formData.instructions.trim(),
        description: formData.description.trim(),
        images: imageUrls,
      });

      toast.success("Recipe updated successfully!");
      navigate(`/recipe/${id}`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update recipe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingRecipe) {
    return (
      <div className="edit-recipe-loading">
        <div className="rdp-spinner" />
        <p>Loading recipe…</p>
      </div>
    );
  }

  return (
    <>
      <section className="add-recipe-page">
        <div className="edit-recipe-header">
          <button className="edit-back-btn" type="button" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1 className="edit-recipe-title">Edit Recipe</h1>
        </div>

        <div className="add-recipe-container">
          {/* ── Left: images ── */}
          <div className="add-recipe-left">
            <h2>Images</h2>
            <div className="image-frame">
              {imageSlots.length === 0 ? (
                <p className="image-placeholder">No images — add at least 1</p>
              ) : (
                <div className="preview-grid">
                  {imageSlots.map((slot) => (
                    <div className="preview-card" key={slot.id}>
                      <div className="preview-media">
                        <img
                          src={slot.previewUrl}
                          alt="Recipe"
                          onLoad={applyAutoZoomForRatio}
                        />
                      </div>
                      <button type="button" onClick={() => handleRemoveImage(slot.id)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="ratio-note">Images are cropped to 4:3 for consistent cards.</p>

            <div className="dots-row" aria-label="image count indicator">
              {Array.from({ length: MAX_IMAGES }).map((_, i) => (
                <span key={i} className={`dot ${i < imageSlots.length ? "active" : ""}`} />
              ))}
            </div>

            <button
              className="add-image-button"
              type="button"
              onClick={handleAddImageClick}
              disabled={imageSlots.length >= MAX_IMAGES}
            >
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

          {/* ── Right: form ── */}
          <div className="add-recipe-right">
            <h2>Edit Details</h2>
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
                Description
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFieldChange}
                  rows={4}
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

              <div className="edit-form-actions">
                <button
                  type="button"
                  className="edit-cancel-btn"
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="create-post-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving…" : "Save Changes"}
                </button>
              </div>
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

export default EditRecipe;
