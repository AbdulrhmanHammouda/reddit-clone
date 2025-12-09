// src/components/ProfileMenu.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cog6ToothIcon,
  ArrowLeftStartOnRectangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import DarkModeToggle from "./DarkModeToggle";
import api from "../api/axios";
import useAuth from "../hooks/useAuth"; // your hook that reads AuthContext

export default function ProfileMenu({ onClose }) {
  const menuRef = useRef();
  const navigate = useNavigate();
  const { token, user, logout, updateUser } = useAuth();

  const [avatar, setAvatar] = useState(user?.avatar || "https://www.redditstatic.com/avatars/avatar_default_07_D4E815.png");

  // Keep local avatar in sync when context user changes
  useEffect(() => {
    if (user?.avatar) setAvatar(user.avatar);
  }, [user]);

  // Fetch latest profile once token + username available, then update context
  useEffect(() => {
    if (!token || !user?.username) return;
    let mounted = true;

    async function fetchLatest() {
      try {
        const res = await api.get(`/users/${encodeURIComponent(user.username)}`);
        const updated = res.data?.data;
        if (!mounted) return;
        if (updated?.avatar && updated.avatar !== avatar) {
          setAvatar(updated.avatar);
          // Update context safely (no re-login / no extra fetch)
          updateUser(updated);
        }
      } catch (err) {
        // Ignore (we still have the fallback avatar)
        console.debug("ProfileMenu: failed to refresh avatar", err);
      }
    }

    fetchLatest();
    return () => {
      mounted = false;
    };
  }, [token, user?.username]); // Only re-run when username or token changes

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleLogout = () => {
    logout();
    window.location.replace("/login"); // Quick redirect (no blank-white wait)
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-72 rounded-xl bg-reddit-card dark:bg-reddit-dark_card shadow-lg border border-reddit-border dark:border-reddit-dark_border overflow-hidden animate-fadeIn z-50"
    >
      <button
        onClick={() => user?.username && navigate(`/u/${user.username}`)}
        className="flex items-center gap-3 p-4 w-full text-left hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
      >
        <img src={avatar} className="h-10 w-10 rounded-full object-cover" alt="avatar" />
        <div>
          <p className="text-sm font-semibold">View Profile</p>
          <p className="text-xs text-reddit-text_secondary">{`u/${user?.username || ""}`}</p>
        </div>
      </button>

      <div className="flex flex-col py-2">
        <MenuItem icon={<DocumentTextIcon className="h-5 w-5" />} label="Drafts" />
        <MenuItem icon={<Cog6ToothIcon className="h-5 w-5" />} label="Settings" />
        <DarkModeToggle />
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
      className="flex items-center gap-3 px-4 py-3 text-sm text-reddit-text dark:text-reddit-dark_text hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition rounded-sm"
    >
      {icon}
      {label}
    </button>
  );
}
