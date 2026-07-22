/**
 * formatCookingTime — converts a cookingTime object or legacy string to
 * a human-readable display string.
 *
 * Handles three input shapes:
 *   1. Structured object: { hours, minutes, seconds }
 *   2. Legacy string stored in timeRequired: "30 minutes", "1 Hour 30 Minutes"
 *   3. Fallback: null / undefined → "N/A"
 *
 * Output examples:
 *   { hours:1, minutes:30, seconds:0 } → "1 Hour 30 Minutes"
 *   { hours:0, minutes:45, seconds:0 } → "45 Minutes"
 *   { hours:0, minutes:1,  seconds:30 } → "1 Minute 30 Seconds"
 *   "30 minutes"  → "30 minutes"  (pass-through for legacy)
 */
export function formatCookingTime(cookingTime, fallbackString = "") {
  // Already a plain string (legacy timeRequired)
  if (typeof cookingTime === "string") {
    return cookingTime || fallbackString || "N/A";
  }

  if (!cookingTime || typeof cookingTime !== "object") {
    return fallbackString || "N/A";
  }

  const hours = Number(cookingTime.hours) || 0;
  const minutes = Number(cookingTime.minutes) || 0;
  const seconds = Number(cookingTime.seconds) || 0;

  const parts = [];
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "Hour" : "Hours"}`);
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "Minute" : "Minutes"}`);
  if (seconds > 0) parts.push(`${seconds} ${seconds === 1 ? "Second" : "Seconds"}`);

  return parts.length > 0 ? parts.join(" ") : fallbackString || "N/A";
}

/**
 * parseCookingTime — parses a recipe's time data into a {hours, minutes, seconds}
 * state object suitable for form inputs.
 *
 * Handles structured cookingTime object or falls back to zeroes.
 */
export function parseCookingTime(recipe) {
  const ct = recipe?.cookingTime;
  if (ct && typeof ct === "object") {
    return {
      hours: String(ct.hours ?? 0),
      minutes: String(ct.minutes ?? 0),
      seconds: String(ct.seconds ?? 0),
    };
  }
  return { hours: "0", minutes: "0", seconds: "0" };
}

/**
 * validateCookingTime — returns an error string or "" if valid.
 */
export function validateCookingTime(ct) {
  const h = Number(ct.hours) || 0;
  const m = Number(ct.minutes) || 0;
  const s = Number(ct.seconds) || 0;

  if (h < 0 || m < 0 || s < 0) return "Cooking time values cannot be negative.";
  if (m > 59) return "Minutes must be between 0 and 59.";
  if (s > 59) return "Seconds must be between 0 and 59.";
  if (h === 0 && m === 0 && s === 0) return "Cooking time cannot be zero — enter at least 1 second.";
  return "";
}
