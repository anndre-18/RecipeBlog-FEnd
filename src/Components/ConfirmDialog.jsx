import React from "react";
import "./ConfirmDialog.css";

/**
 * ConfirmDialog
 * Props:
 *   isOpen       – boolean
 *   title        – string
 *   message      – string
 *   confirmLabel – string (default "Confirm")
 *   cancelLabel  – string (default "Cancel")
 *   variant      – "danger" | "default"
 *   onConfirm    – () => void
 *   onCancel     – () => void
 */
const ConfirmDialog = ({
  isOpen,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="confirm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onCancel}
    >
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-title">{title}</h3>
        {message && <p className="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button
            type="button"
            className="confirm-btn cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-btn action ${variant}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
