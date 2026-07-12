import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import "./ImageCropper.css";

/**
 * getCroppedImg - takes an image src and crop pixel data, returns a blob URL
 */
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImageBitmap(await (await fetch(imageSrc)).blob());
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg", 0.92);
  });
}

/**
 * ImageCropper
 * Props:
 *   imageSrc  – object URL of the raw image to crop
 *   aspect    – number e.g. 1 (profile) or 4/3 (recipe)
 *   onCancel  – () => void
 *   onConfirm – (blob) => void
 */
const ImageCropper = ({ imageSrc, aspect = 1, onCancel, onConfirm }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      // Apply rotation by drawing to a rotated canvas first
      const blob = await getCroppedImgWithRotation(imageSrc, croppedAreaPixels, rotation);
      onConfirm(blob);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="cropper-overlay" role="dialog" aria-modal="true" aria-label="Crop image">
      <div className="cropper-modal">
        <div className="cropper-header">
          <h3>Crop Image</h3>
          <p>{aspect === 1 ? "Profile photo — 1:1" : "Recipe photo — 4:3"}</p>
        </div>

        <div className="cropper-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            showGrid={false}
            cropShape={aspect === 1 ? "round" : "rect"}
          />
        </div>

        <div className="cropper-controls">
          <div className="cropper-control-row">
            <label htmlFor="zoom-slider">
              <span className="ctrl-icon">🔍</span> Zoom
            </label>
            <input
              id="zoom-slider"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="cropper-slider"
            />
            <span className="ctrl-value">{zoom.toFixed(1)}×</span>
          </div>

          {aspect !== 1 && (
            <div className="cropper-control-row">
              <label htmlFor="rotate-slider">
                <span className="ctrl-icon">🔄</span> Rotate
              </label>
              <input
                id="rotate-slider"
                type="range"
                min={-45}
                max={45}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="cropper-slider"
              />
              <span className="ctrl-value">{rotation}°</span>
            </div>
          )}
        </div>

        <div className="cropper-actions">
          <button
            type="button"
            className="cropper-btn cancel"
            onClick={onCancel}
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cropper-btn confirm"
            onClick={handleConfirm}
            disabled={processing}
          >
            {processing ? "Processing…" : "Confirm Crop"}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * getCroppedImgWithRotation - handles rotation via canvas before cropping
 */
async function getCroppedImgWithRotation(imageSrc, pixelCrop, rotation = 0) {
  const img = await loadImage(imageSrc);

  const rotCanvas = document.createElement("canvas");
  const rotCtx = rotCanvas.getContext("2d");

  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  rotCanvas.width = img.width * cos + img.height * sin;
  rotCanvas.height = img.width * sin + img.height * cos;

  rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
  rotCtx.rotate(rad);
  rotCtx.drawImage(img, -img.width / 2, -img.height / 2);

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    rotCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default ImageCropper;
