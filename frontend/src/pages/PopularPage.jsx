// src/pages/PopularPage.jsx
import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import SortMenu from "../components/SortMenu";
import PostCard from "../components/PostCard";
import TrendingCommunitiesWidget from "../components/TrendingCommunitiesWidget";
import RecentPosts from "../components/RecentPosts";

export default function PopularPage() {
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
      const res = await api.get(`/posts/popular?sort=${sort}&time=${time}&page=${pageNum}&limit=20`);
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
    <div className="w-full flex justify-center">
      <div className="w-full max-w-6xl px-4 md:px-6 pt-4 pb-10 flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Header - Reddit style */}
          <header className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-reddit-text dark:text-reddit-dark_text">
                Popular
              </h1>
              <p className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary truncate">
                The best posts on Reddit for you, pulled from the most active communities
              </p>
            </div>
          </header>

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
                  <div className="flex gap-3">
                    <div className="h-8 w-8 bg-reddit-hover dark:bg-reddit-dark_hover rounded-full" />
                    <div className="flex-1">
                      <div className="h-3 bg-reddit-hover dark:bg-reddit-dark_hover rounded w-1/4 mb-2" />
                      <div className="h-5 bg-reddit-hover dark:bg-reddit-dark_hover rounded w-3/4 mb-3" />
                      <div className="h-48 bg-reddit-hover dark:bg-reddit-dark_hover rounded" />
                    </div>
                  </div>
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
        </main>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 space-y-4 flex-shrink-0">
          {/* Trending Communities */}
          <TrendingCommunitiesWidget />
          
          {/* About Popular Card */}
          <div className="bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-reddit-border dark:border-reddit-dark_divider">
              <h3 className="font-semibold text-reddit-text dark:text-reddit-dark_text">
                About Popular
              </h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                See the best posts from communities across the site. This feed is curated to show trending content from everywhere.
              </p>
            </div>
          </div>

          {/* Recent Posts */}
          <RecentPosts />
        </aside>
      </div>
    </div>
  );
}