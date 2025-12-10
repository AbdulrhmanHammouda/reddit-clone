import React from "react";

export default function ProfileTabs({ tabs = [], active, onChange }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange?.(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              isActive
                ? "bg-reddit-hover dark:bg-reddit-dark_hover text-reddit-text dark:text-reddit-dark_text"
                : "text-reddit-text_secondary dark:text-reddit-dark_text_secondary hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

