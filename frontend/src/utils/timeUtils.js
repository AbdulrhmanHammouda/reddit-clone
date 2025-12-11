/**
 * Utility functions for formatting dates and times
 */

/**
 * Get human-readable relative time string
 * @param {string|Date} date - The date to format
 * @returns {string} Relative time string like "5m ago", "2h ago", "3d ago"
 */
export function getTimeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

/**
 * Format date for display (e.g., "Dec 10")
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Format full date with time
 * @param {string|Date} date - The date to format
 * @returns {string} Full formatted date string
 */
export function formatDateTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleString();
}
