// src/components/DarkModeToggle.jsx
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

function getInitialMode() {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem("darkMode");
  if (saved !== null) return saved === "true";
  if (document.documentElement.classList.contains("dark")) return true;
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark;
}

export default function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(getInitialMode);

  useEffect(() => {
    const root = document.documentElement;
    const next = isDarkMode ? "true" : "false";
    if (isDarkMode) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("darkMode", next);
  }, [isDarkMode]);

  return (
    <button
      type="button"
      onClick={() => setIsDarkMode((prev) => !prev)}
      className="flex items-center gap-3 px-4 py-3 text-sm text-reddit-text dark:text-reddit-dark_text hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition rounded-sm w-full"
    >
      {isDarkMode ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
      <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}
