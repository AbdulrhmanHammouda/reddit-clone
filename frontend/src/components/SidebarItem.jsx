import React from "react";

export default function SidebarItem({ Icon, label, badge, onClick, sidebarOpen = true }) {
  // When closed, render an icon-only centered button. When open, render full label + badge.
  const openClasses = "w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-reddit-hover transition text-left focus:outline-none focus:ring-2 focus:ring-reddit-blue";
  const closedClasses = "w-full flex items-center justify-center py-3 rounded-lg hover:bg-reddit-hover transition focus:outline-none focus:ring-2 focus:ring-reddit-blue";

  return (
    <button
      type="button"
      onClick={onClick}
      className={sidebarOpen ? openClasses : closedClasses}
      aria-label={label}
    >
      {Icon && (
        <Icon className={sidebarOpen ? "h-5 w-5 text-reddit-icon flex-shrink-0" : "h-5 w-5 text-reddit-icon"} />
      )}

      {/* keep label accessible but visually hidden when closed */}
      <span className={sidebarOpen ? "text-sm text-reddit-text_secondary ml-1" : "sr-only"}>{label}</span>

      {badge && sidebarOpen && <div className="ml-auto">{badge}</div>}
    </button>
  );
}
