import {
  MagnifyingGlassIcon,
  ChatBubbleOvalLeftIcon,
  BellIcon,
  PlusIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import logo from "../assets/reddit-logo.png";

// props: onToggleSidebar
export default function Navbar({ onToggleSidebar }) {
  return (
    <>
      <nav className="w-full h-14 bg-reddit-card dark:bg-reddit-card border-b border-reddit-border dark:border-reddit-divider px-4 flex items-center justify-between sticky top-0 z-50">

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
          <div className="flex items-center gap-1 cursor-pointer select-none">
            <img src={logo} alt="Reddit" className="h-7" />
            <span className="font-bold text-xl text-reddit-text dark:text-reddit-text">
              reddit
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex justify-center px-4">
          <div className="w-full max-w-xl relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-reddit-icon" />
            <input
              type="text"
              placeholder="Search Reddit"
              className="w-full bg-reddit-hover dark:bg-reddit-hover_dark border border-reddit-border dark:border-reddit-divider rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-reddit-upvote"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">

          {/* Chat */}
          <div className="relative group">
            <ChatBubbleOvalLeftIcon className="h-6 w-6 text-reddit-icon p-1 rounded-full cursor-pointer transition hover:bg-reddit-hover dark:hover:bg-reddit-hover_dark" />
            <span className="tooltip">Chat</span>
          </div>

          {/* Create Button */}
          <div className="relative group flex items-center gap-1 bg-reddit-blue hover:bg-reddit-blue_hover px-3 py-1 rounded-full cursor-pointer transition">
            <PlusIcon className="h-5 w-5 text-reddit-card" />
            <span className="text-sm text-reddit-card">Create</span>
            {/* <span className="tooltip">Create post</span> */}
          </div>

          {/* Notifications */}
          <div className="relative group">
            <BellIcon className="h-6 w-6 text-reddit-icon p-1 rounded-full cursor-pointer transition hover:bg-reddit-hover dark:hover:bg-reddit-hover_dark" />
            <span className="tooltip">Notifications</span>
          </div>

          {/* Profile */}
          <div className="relative group">
            <div className="w-8 h-8 rounded-full bg-reddit-hover cursor-pointer" />
            <span className="tooltip">Profile</span>
          </div>
        </div>
      </nav>
    </>
  );
}
