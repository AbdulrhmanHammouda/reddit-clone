import { useEffect, useState } from "react";
import { MoonIcon } from "@heroicons/react/24/outline";

export default function DarkModeToggle() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (enabled) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [enabled]);

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className="
        flex items-center justify-between px-4 py-3 text-sm w-full
        text-reddit-text dark:text-reddit-dark_text 
        hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover
      "
    >
      <span className="flex items-center gap-3">
        <MoonIcon className="h-5 w-5" />
        Dark Mode
      </span>

      {/* toggle */}
      <div
        className={`
          w-10 h-5 rounded-full transition flex items-center px-1
          ${enabled ? "bg-reddit-blue dark:bg-reddit-dark_blue" : "bg-reddit-hover dark:bg-reddit-dark_hover"}
        `}
      >
        <div
          className={`
            w-4 h-4 bg-reddit-card dark:bg-reddit-dark_card rounded-full transition
            ${enabled ? "translate-x-5" : "translate-x-0"}
          `}
        ></div>
      </div>
    </button>
  );
}
