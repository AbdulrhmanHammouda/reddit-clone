import { useEffect, useRef } from "react";
import {
  UserIcon,
  Cog6ToothIcon,
  ArrowLeftStartOnRectangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import DarkModeToggle from "./DarkModeToggle";

export default function ProfileMenu({ onClose }) {
  const menuRef = useRef();

  // close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // mock user
  const user = {
    username: "SignificanceSad7142",
    avatar: "https://www.redditstatic.com/avatars/avatar_default_07_FF66AC.png",
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
      <div className="flex items-center gap-3 p-4 border-b border-reddit-border dark:border-reddit-dark_border">
        <img
          src={user.avatar}
          className="h-10 w-10 rounded-full"
          alt="avatar"
        />
        <div>
          <p className="text-sm font-semibold text-reddit-text dark:text-reddit-dark_text">
            View Profile
          </p>
          <p className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
            u/{user.username}
          </p>
        </div>
      </div>

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

        {/* Dark Mode Toggle */}
        <DarkModeToggle />

        <MenuItem
          icon={<ArrowLeftStartOnRectangleIcon className="h-5 w-5" />}
          label="Log Out"
        />
      </div>
    </div>
  );
}

function MenuItem({ icon, label }) {
  return (
    <button
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
