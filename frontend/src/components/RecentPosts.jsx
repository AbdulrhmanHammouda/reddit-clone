import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";

// Key for localStorage
const RECENT_POSTS_KEY = "recentPosts";
const MAX_RECENT_POSTS = 5;

// Helper to get recent posts from localStorage
export function getRecentPosts() {
  try {
    const stored = localStorage.getItem(RECENT_POSTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Helper to add a post to recent posts
export function addRecentPost(post) {
  if (!post?._id || !post?.title) return;

  const recentPosts = getRecentPosts();

  // Remove if already exists (to move to top)
  const filtered = recentPosts.filter((p) => p._id !== post._id);

  // Add to beginning
  const updated = [
    {
      _id: post._id,
      title: post.title,
      community: post.community?.name || post.community,
      author: post.author?.username || post.author,
      score: post.score || 0,
      commentsCount: post.commentsCount || 0,
      thumbnail: post.images?.[0] || post.imageUrl?.[0] || null,
      viewedAt: Date.now(),
    },
    ...filtered,
  ].slice(0, MAX_RECENT_POSTS);

  localStorage.setItem(RECENT_POSTS_KEY, JSON.stringify(updated));
}

// Helper to clear recent posts
export function clearRecentPosts() {
  localStorage.removeItem(RECENT_POSTS_KEY);
}

export default function RecentPosts() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    setPosts(getRecentPosts());

    // Listen for storage changes (from other tabs or when posts are added)
    const handleStorage = () => setPosts(getRecentPosts());
    window.addEventListener("storage", handleStorage);
    
    // Poll for updates every 2 seconds (for same-tab updates)
    const interval = setInterval(() => setPosts(getRecentPosts()), 2000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  const handleClear = () => {
    clearRecentPosts();
    setPosts([]);
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (posts.length === 0) return null;

  return (
    <div className="bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-reddit-border dark:border-reddit-dark_divider">
        <span className="text-xs font-semibold text-reddit-text_secondary dark:text-reddit-dark_text_secondary uppercase tracking-wide">
          Recent Posts
        </span>
        <button
          onClick={handleClear}
          className="text-xs text-reddit-blue hover:underline"
        >
          Clear
        </button>
      </div>

      {/* Posts List */}
      <div className="divide-y divide-reddit-border dark:divide-reddit-dark_divider">
        {posts.map((post) => (
          <Link
            key={post._id}
            to={`/post/${post._id}`}
            className="flex gap-3 p-3 hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
          >
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Community & Time */}
              <div className="flex items-center gap-1 text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary mb-1">
                {post.community && (
                  <>
                    <span className="font-medium text-reddit-text dark:text-reddit-dark_text">
                      r/{post.community}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span>{getTimeAgo(post.viewedAt)}</span>
              </div>

              {/* Title */}
              <h4 className="text-sm font-medium text-reddit-text dark:text-reddit-dark_text line-clamp-2 leading-tight">
                {post.title}
              </h4>

              {/* Stats */}
              <div className="flex items-center gap-2 mt-1.5 text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                <span>{post.score} upvotes</span>
                <span>•</span>
                <span>{post.commentsCount} comments</span>
              </div>
            </div>

            {/* Thumbnail */}
            {post.thumbnail && (
              <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-reddit-hover dark:bg-reddit-dark_hover">
                <img
                  src={post.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
