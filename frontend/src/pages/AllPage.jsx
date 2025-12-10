// src/pages/AllPage.jsx
import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import SortMenu from "../components/SortMenu";
import PostCard from "../components/PostCard";

export default function AllPage() {
  const [sort, setSort] = useState("hot");
  const [time, setTime] = useState("day");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async (pageNum = 1, reset = false) => {
    if (reset) {
      setLoading(true);
      setPosts([]);
    } else if (pageNum > 1) {
      setLoadingMore(true);
    }

    try {
      const res = await api.get(`/posts/all?sort=${sort}&time=${time}&page=${pageNum}&limit=20`);
      const data = res.data?.data;
      
      if (data?.posts) {
        if (reset || pageNum === 1) {
          setPosts(data.posts);
        } else {
          setPosts(prev => [...prev, ...data.posts]);
        }
        setHasMore(data.posts.length === 20);
        setPage(pageNum);
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load posts");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sort, time]);

  useEffect(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(page + 1);
    }
  };

  const handleSortChange = (newSort, newTime) => {
    setSort(newSort);
    if (newTime) setTime(newTime);
  };

  return (
    <div className="w-full pb-10">
      {/* Sort Menu */}
      <div className="mb-4">
        <SortMenu 
          value={sort} 
          onChange={(s, t) => handleSortChange(s, t)} 
        />
      </div>

      {/* Posts */}
      <section className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-reddit-card dark:bg-reddit-dark_card rounded-xl p-4 border border-reddit-border dark:border-reddit-dark_divider"
            >
              <div className="flex gap-3 mb-3">
                <div className="h-6 w-6 bg-reddit-hover dark:bg-reddit-dark_hover rounded-full" />
                <div className="h-4 bg-reddit-hover dark:bg-reddit-dark_hover rounded w-32" />
                <div className="h-4 bg-reddit-hover dark:bg-reddit-dark_hover rounded w-16 ml-auto" />
              </div>
              <div className="h-5 bg-reddit-hover dark:bg-reddit-dark_hover rounded w-3/4 mb-3" />
              <div className="h-64 bg-reddit-hover dark:bg-reddit-dark_hover rounded" />
            </div>
          ))
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => fetchPosts(1, true)}
              className="px-4 py-2 rounded-full bg-reddit-blue text-white"
            >
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
            No posts found
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 rounded-full bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider text-sm font-medium hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover disabled:opacity-50 transition"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}