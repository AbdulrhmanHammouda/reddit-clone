import { useEffect, useState } from "react";
import PostCard from "./PostCard";
import api from "../api/axios";

export default function PostsFeed({ sort = "best", time = "all" }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/posts", {
          params: {
            sort,
            time: sort === "top" ? time : undefined,
            page: 1,
            limit: 20,
          },
        });
        if (cancelled) return;
        setPosts(res.data?.data?.posts || []);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.error || err.message || "Failed to load posts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sort, time]);

  if (loading)
    return (
      <p className="text-center text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
        Loading…
      </p>
    );

  if (error)
    return (
      <p className="text-center text-red-500">
        {error}
      </p>
    );

  if (!posts.length)
    return (
      <p className="text-center text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
        No posts yet.
      </p>
    );

  return (
    <div className="w-full max-w-[740px] flex flex-col gap-4 bg-reddit-page dark:bg-reddit-dark_bg transition-colors duration-200">
      {posts.map((post) => (
        <PostCard key={post._id || post.id} post={post} />
      ))}
    </div>
  );
}
