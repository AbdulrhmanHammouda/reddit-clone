import React from "react";

export default function SidebarItem({ Icon, label, badge, onClick, sidebarOpen = true }) {
  const openClasses =
    "w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition text-left cursor-pointer";
  const closedClasses =
    "w-full flex items-center justify-center py-3 rounded-lg hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition cursor-pointer";

  return (
    <button
      type="button"
      onClick={onClick}
      className={sidebarOpen ? openClasses : closedClasses}
    >
      {Icon && (
        <Icon
          className="h-5 w-5 text-reddit-icon dark:text-reddit-dark_icon flex-shrink-0"
        />
      )}

      <span
        className={
          sidebarOpen
            ? "text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary ml-1"
            : "sr-only"
        }
      >
        {label}
      </span>

      {badge && sidebarOpen && <div className="ml-auto">{badge}</div>}
    </button>
  );
}
