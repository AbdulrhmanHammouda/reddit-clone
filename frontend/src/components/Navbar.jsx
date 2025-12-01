import {
  MagnifyingGlassIcon,
  ChatBubbleOvalLeftIcon,
  BellIcon,
  PlusIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import logo from "../assets/reddit-logo.png";
import ProfileMenu from "./ProfileMenu";
import { Link } from "react-router-dom";

export default function Navbar({ onToggleSidebar }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="w-full h-16 bg-reddit-card dark:bg-reddit-dark_card border-b border-reddit-border dark:border-reddit-dark_divider px-5 flex items-center justify-between sticky top-0 z-50">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button (visible < lg) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden flex items-center justify-center h-10 w-10 rounded-full bg-reddit-card border border-reddit-border shadow-sm hover:bg-reddit-hover text-reddit-icon focus:outline-none focus:ring-2 focus:ring-reddit-blue"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          {/* Logo + text */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer select-none">
            <img src={logo} alt="Reddit" className="h-8" />
            <span className="font-bold text-3xl text-reddit-text dark:text-reddit-dark_text">
              reddit
            </span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex justify-center px-4">
          <div className="w-full max-w-xl relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2 h-5 w-5 text-reddit-icon dark:text-reddit-dark_icon" />
            <input
              type="text"
              placeholder="Search Reddit"
              className="w-full bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider rounded-full pl-12 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-reddit-upvote"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Chat */}
          <div className="relative group">
            <ChatBubbleOvalLeftIcon className="h-7 w-7 text-reddit-icon dark:text-reddit-dark_icon p-1 rounded-full cursor-pointer transition hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover" />
            <span className="tooltip">Chat</span>
          </div>

        {/* Create Button */}
        <div
          className="
            group relative flex items-center gap-2
            px-3 py-1.5 rounded-full cursor-pointer transition
            hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover
          "
        >
          <PlusIcon className="h-5 w-5 text-reddit-icon dark:text-reddit-dark_icon" />
          <span className="text-sm font-medium text-reddit-text dark:text-reddit-dark_text">
            Create
          </span>
        </div>
          {/* Notifications */}
          <div className="relative group">
            <BellIcon className="h-7 w-7 text-reddit-icon dark:text-reddit-dark_icon p-1 rounded-full cursor-pointer transition hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover" />
            <span className="tooltip">Notifications</span>
          </div>

          {/* Profile */}
          <div className="relative">
            <img
              src="https://www.redditstatic.com/avatars/avatar_default_07_FF66AC.png"
              alt="user"
              className="h-8 w-8 rounded-full cursor-pointer"
              onClick={() => setOpen(!open)}
            />

            {open && <ProfileMenu onClose={() => setOpen(false)} />}
          </div>
        </div>
      </nav>
    </>
  );
}
