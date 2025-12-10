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

  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const notificationsRef = useRef(null);

  const userRaw = JSON.parse(localStorage.getItem("user"));
  const username = userRaw?.username;
  const token = localStorage.getItem("token");

  const [userAvatar, setUserAvatar] = useState(defaultProfileImg);

  useEffect(() => {
    if (!token || !username) return;

    api
      .get(`/users/${username}`)
      .then((res) => {
        const avatar = res.data?.data?.avatar;
        if (avatar) setUserAvatar(avatar);
        else setUserAvatar(defaultProfileImg);
      })
      .catch((err) => console.error(err));
  }, [username, token]);

  // Fetch unread notification count
  useEffect(() => {
    if (!token) return;

    const fetchUnreadCount = async () => {
      // Only fetch if tab is visible
      if (document.hidden) return;
      try {
        const res = await api.get("/notifications/unread-count");
        if (res.data?.success) {
          setUnreadCount(res.data.data.count);
        }
      } catch (err) {
        // Silent fail for polling
      }
    };

    fetchUnreadCount();
    // Poll every 60 seconds (only when visible)
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [token]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!notificationsOpen || !token) return;

    const fetchNotifications = async () => {
      setNotificationsLoading(true);
      try {
        const res = await api.get("/notifications?limit=10");
        if (res.data?.success) {
          setNotifications(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchNotifications();
  }, [notificationsOpen, token]);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await api.patch(`/notifications/${notification._id}/read`);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
        );
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    // Navigate based on notification type
    setNotificationsOpen(false);
    if (notification.sourcePost) {
      navigate(`/post/${notification.sourcePost._id}`);
    } else if (notification.sourceCommunity) {
      navigate(`/r/${notification.sourceCommunity.name}`);
    } else if (notification.sourceUser) {
      navigate(`/u/${notification.sourceUser.username}`);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const getNotificationText = (notification) => {
    const user = notification.sourceUser?.username || "Someone";
    switch (notification.type) {
      case "reply":
        return `${user} replied to your comment`;
      case "vote":
        return `${user} upvoted your post`;
      case "message":
        return `${user} sent you a message`;
      case "follow":
        return `${user} started following you`;
      case "community_invite":
        return `You were invited to join r/${notification.sourceCommunity?.name || "a community"}`;
      default:
        return "You have a new notification";
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

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
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-1 rounded-full cursor-pointer transition hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
            >
              <BellIcon className="h-6 w-6 text-reddit-icon dark:text-reddit-dark_icon" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-reddit-orange text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-reddit-border dark:border-reddit-dark_divider">
                  <h3 className="font-semibold text-reddit-text dark:text-reddit-dark_text">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-reddit-blue hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="p-4 text-center text-reddit-text_secondary">
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-reddit-text_secondary">
                      <BellIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left px-4 py-3 hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover border-b border-reddit-border dark:border-reddit-dark_divider last:border-b-0 ${
                          !notification.read ? "bg-reddit-blue/5" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={notification.sourceUser?.avatar || defaultProfileImg}
                            alt=""
                            className="h-8 w-8 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-reddit-text dark:text-reddit-dark_text">
                              {getNotificationText(notification)}
                            </p>
                            {notification.sourcePost && (
                              <p className="text-xs text-reddit-text_secondary truncate mt-0.5">
                                {notification.sourcePost.title}
                              </p>
                            )}
                            <p className="text-xs text-reddit-text_secondary mt-1">
                              {getTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-reddit-blue rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
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

