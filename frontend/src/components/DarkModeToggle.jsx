// src/components/DarkModeToggle.jsx
import { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export default function DarkModeToggle() {
  // Initialize state from localStorage or default to false (light mode)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("darkMode");
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Effect to apply the dark class to <html> and save to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center gap-3 px-4 py-3 text-sm text-reddit-text dark:text-reddit-dark_text hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition rounded-sm w-full"
    >
      {isDarkMode 
        ? <SunIcon className="h-5 w-5" /> 
        : <MoonIcon className="h-5 w-5" />
      }
      <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}
