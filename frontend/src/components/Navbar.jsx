import {
  MagnifyingGlassIcon,
  ChatBubbleOvalLeftIcon,
  BellIcon,
  PlusIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState, useRef } from "react";
import logo from "../assets/reddit-logo.png";
import ProfileMenu from "./ProfileMenu";
import { Link, useNavigate } from "react-router-dom";
import ChatSidebar from "./ChatSidebar";
import api from "../api/axios";
import defaultProfileImg from "../assets/default_profile.jpeg";

export default function Navbar({ onToggleSidebar }) {
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const userRaw = JSON.parse(localStorage.getItem("user"));
  const username = userRaw?.username;

  const [userAvatar, setUserAvatar] = useState(defaultProfileImg);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !username) return;

    api
      .get(`/users/${username}`)
      .then((res) => {
        const avatar = res.data?.data?.avatar;
        if (avatar) setUserAvatar(avatar);
        else setUserAvatar(defaultProfileImg);
      })
      .catch((err) => console.error(err));
  }, [username]);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.data?.success) {
          setSearchResults(res.data.data);
          setShowResults(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (type, item) => {
    setShowResults(false);
    setSearchQuery("");
    if (type === "post") navigate(`/post/${item._id}`);
    else if (type === "user") navigate(`/u/${item.username}`);
    else if (type === "community") navigate(`/r/${item.name}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setShowResults(false);
  };

  return (
    <>
      <nav className="w-full h-16 bg-reddit-card dark:bg-reddit-dark_card border-b border-reddit-border dark:border-reddit-dark_divider px-5 flex items-center justify-between sticky top-0 z-50">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden flex items-center justify-center h-10 w-10 rounded-full bg-reddit-card border border-reddit-border shadow-sm hover:bg-reddit-hover text-reddit-icon focus:outline-none focus:ring-2 focus:ring-reddit-blue"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <img src={logo} alt="Reddit" className="h-8" />
            <span className="font-bold text-3xl text-reddit-text dark:text-reddit-dark_text">
              reddit
            </span>
          </Link>
        </div>

        {/* Search */}
        <div className="flex-1 flex justify-center px-4" ref={searchRef}>
          <div className="w-full max-w-xl relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-reddit-icon dark:text-reddit-dark_icon" />
            <input
              type="text"
              placeholder="Search Reddit"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults && setShowResults(true)}
              className="w-full bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider rounded-full pl-12 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-reddit-blue text-reddit-text dark:text-reddit-dark_text"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-2.5 text-reddit-icon hover:text-reddit-text"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showResults && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-xl shadow-xl max-h-[70vh] overflow-y-auto z-50">
                {searchLoading && (
                  <div className="p-4 text-center text-reddit-text_secondary">
                    Searching...
                  </div>
                )}

                {!searchLoading && (
                  <>
                    {/* Communities */}
                    {searchResults.communities?.length > 0 && (
                      <div className="p-2">
                        <div className="text-xs font-semibold text-reddit-text_secondary dark:text-reddit-dark_text_secondary px-3 py-1">
                          COMMUNITIES
                        </div>
                        {searchResults.communities.map((c) => (
                          <button
                            key={c._id}
                            onClick={() => handleResultClick("community", c)}
                            className="w-full text-left px-3 py-2 hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover rounded-lg flex items-center gap-3"
                          >
                            <div className="h-8 w-8 bg-reddit-blue rounded-full flex items-center justify-center text-white font-bold text-sm">
                              r/
                            </div>
                            <div>
                              <div className="text-sm font-medium text-reddit-text dark:text-reddit-dark_text">
                                r/{c.name}
                              </div>
                              <div className="text-xs text-reddit-text_secondary">
                                {c.membersCount || 0} members
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Users */}
                    {searchResults.users?.length > 0 && (
                      <div className="p-2 border-t border-reddit-border dark:border-reddit-dark_divider">
                        <div className="text-xs font-semibold text-reddit-text_secondary dark:text-reddit-dark_text_secondary px-3 py-1">
                          USERS
                        </div>
                        {searchResults.users.map((u) => (
                          <button
                            key={u._id}
                            onClick={() => handleResultClick("user", u)}
                            className="w-full text-left px-3 py-2 hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover rounded-lg flex items-center gap-3"
                          >
                            <img
                              src={u.avatar || defaultProfileImg}
                              alt={u.username}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="text-sm font-medium text-reddit-text dark:text-reddit-dark_text">
                                u/{u.username}
                              </div>
                              {u.displayName && (
                                <div className="text-xs text-reddit-text_secondary">
                                  {u.displayName}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Posts */}
                    {searchResults.posts?.length > 0 && (
                      <div className="p-2 border-t border-reddit-border dark:border-reddit-dark_divider">
                        <div className="text-xs font-semibold text-reddit-text_secondary dark:text-reddit-dark_text_secondary px-3 py-1">
                          POSTS
                        </div>
                        {searchResults.posts.map((p) => (
                          <button
                            key={p._id}
                            onClick={() => handleResultClick("post", p)}
                            className="w-full text-left px-3 py-2 hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover rounded-lg"
                          >
                            <div className="text-sm font-medium text-reddit-text dark:text-reddit-dark_text line-clamp-1">
                              {p.title}
                            </div>
                            <div className="text-xs text-reddit-text_secondary mt-0.5">
                              r/{p.community?.name || "unknown"} • u/{p.author?.username || "unknown"}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No results */}
                    {!searchResults.communities?.length &&
                      !searchResults.users?.length &&
                      !searchResults.posts?.length && (
                        <div className="p-4 text-center text-reddit-text_secondary">
                          No results found for "{searchQuery}"
                        </div>
                      )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Chat */}
          <div className="relative group">
            <ChatBubbleOvalLeftIcon
              className="h-7 w-7 text-reddit-icon dark:text-reddit-dark_icon p-1 rounded-full cursor-pointer transition hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
              onClick={() => setChatOpen(true)}
            />
            <ChatSidebar open={chatOpen} onClose={() => setChatOpen(false)} />
          </div>

          {/* Create */}
          <div
            onClick={() => navigate("/createpost")}
            className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
          >
            <PlusIcon className="h-5 w-5 text-reddit-icon dark:text-reddit-dark_icon" />
            <span className="text-sm font-medium text-reddit-text dark:text-reddit-dark_text">
              Create
            </span>
          </div>

          {/* Notifications */}
          <div className="relative group">
            <BellIcon className="h-7 w-7 text-reddit-icon dark:text-reddit-dark_icon p-1 rounded-full cursor-pointer transition hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover" />
          </div>

          {/* Profile */}
          <div className="relative">
            <img
              src={userAvatar || defaultProfileImg}
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

