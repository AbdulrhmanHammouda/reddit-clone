import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cog6ToothIcon,
  ArrowLeftStartOnRectangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import DarkModeToggle from "./DarkModeToggle";

export default function ProfileMenu({ onClose }) {
  const menuRef = useRef();
  const navigate = useNavigate();

  // ✔ Real user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // ✔ Log Out handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div
      ref={menuRef}
      className="
        absolute right-0 mt-2 w-72 rounded-xl 
        bg-reddit-card dark:bg-reddit-dark_card 
        shadow-lg border border-reddit-border dark:border-reddit-dark_border 
        overflow-hidden animate-fadeIn z-50
      "
    >

      {/* Top user header */}
      <button
        onClick={() => navigate(`/u/${user?.username}`)} // 👈 navigate to profile
        className="flex items-center gap-3 p-4 w-full text-left
                   hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
      >
        <img
          src={user?.avatar ||
            "https://www.redditstatic.com/avatars/avatar_default_07_FF66AC.png"}
          className="h-10 w-10 rounded-full"
          alt="avatar"
        />
        <div>
          <p className="text-sm font-semibold">
            View Profile
          </p>
          <p className="text-xs text-reddit-text_secondary">
            u/{user?.username}
          </p>
        </div>
      </button>

      {/* Menu options */}
      <div className="flex flex-col py-2">

        <MenuItem
          icon={<DocumentTextIcon className="h-5 w-5" />}
          label="Drafts"
        />

        <MenuItem
          icon={<Cog6ToothIcon className="h-5 w-5" />}
          label="Settings"
        />

        <DarkModeToggle />

        {/* ✔ Log Out button */}
        <MenuItem
          icon={<ArrowLeftStartOnRectangleIcon className="h-5 w-5" />}
          label="Log Out"
          onClick={handleLogout}
        />
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-3 px-4 py-3 text-sm 
        text-reddit-text dark:text-reddit-dark_text 
        hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover
        transition rounded-sm
      "
    >
      {icon}
      {label}
    </button>
  );
}
