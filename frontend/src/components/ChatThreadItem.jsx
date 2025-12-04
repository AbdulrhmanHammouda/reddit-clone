// src/components/ChatThreadItem.jsx
import React from "react";

export default function ChatThreadItem({ avatar, name, preview, time, unread = 0, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition"
      aria-label={`Open chat with ${name}`}
    >
      <img
        src={avatar}
        alt={`${name} avatar`}
        className="h-12 w-12 rounded-full flex-shrink-0 object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium text-sm text-reddit-text dark:text-reddit-dark_text truncate">
            {name}
          </div>
          {time && (
            <div className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
              {time}
            </div>
          )}
        </div>
        <div className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary truncate mt-1">
          {preview}
        </div>
      </div>

      {unread > 0 && (
        <div className="ml-2 flex items-center">
          <div className="min-w-[20px] h-5 text-xs flex items-center justify-center rounded-full bg-reddit-blue text-white px-2">
            {unread}
          </div>
        </div>
      )}
    </button>
  );
}
