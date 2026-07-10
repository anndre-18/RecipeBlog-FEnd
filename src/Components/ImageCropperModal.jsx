import React, { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImageBlob } from "../utils/cropImage";
import "./ImageCropperModal.css";

const ImageCropperModal = ({
  imageSrc,
  aspect = 1,
  title = "Crop Image",
  showRotate = false,
  onConfirm,
  onCancel,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handlePreview = async () => {
    if (!croppedAreaPixels) return;
    setError("");
    try {
      const blob = await getCroppedImageBlob(
        imageSrc,
        croppedAreaPixels,
        showRotate ? rotation : 0
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setError("Failed to generate preview.");
    }
  };

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    setError("");
    try {
      const blob = await getCroppedImageBlob(
        imageSrc,
        croppedAreaPixels,
        showRotate ? rotation : 0
      );
      onConfirm(blob);
    } catch {
      setError("Failed to crop image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cropper-backdrop" onClick={onCancel}>
      <div className="cropper-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cropper-header">
          <h3>{title}</h3>
          <button type="button" className="cropper-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="cropper-stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={showRotate ? rotation : 0}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={showRotate ? setRotation : undefined}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="cropper-controls">
          <label>
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </label>

          {showRotate && (
            <label>
              Rotate
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
              />
            </label>
          )}
        </div>

        {previewUrl && (
          <div className="cropper-preview-wrap">
            <span>Preview</span>
            <img
              src={previewUrl}
              alt="Crop preview"
              className={aspect === 1 ? "cropper-preview-circle" : "cropper-preview"}
            />
          </div>
        )}

        {error && <p className="cropper-error">{error}</p>}

        <div className="cropper-actions">
          <button type="button" className="cropper-btn secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="cropper-btn secondary" onClick={handlePreview}>
            Preview
          </button>
          <button
            type="button"
            className="cropper-btn primary"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Saving..." : "Apply Crop"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
