import { useEffect, useState } from "react";
import PostCard from "./PostCard";

export default function PostsFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fake API for now — real API later
  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // TODO: replace with real API call
      const data = [
        {
          id: 1,
          subreddit: "freelance_forhire",
          author: "john_doe",
          time: "6 hr ago",
          location: "Popular near you",
          title: "[Hiring] Chatters Needed - Weekly Payment",
          body: "What we offer: High-paying position with real earning potential...",
          upvotes: 30,
          comments: 55,
          icon: "https://www.redditstatic.com/avatars/avatar_default_06_FF4500.png"
        },
        {
          id: 2,
          subreddit: "movies",
          author: "filmlover",
          time: "8 hr ago",
          location: "Trending",
          title: "Time Cop 1994 – Matter from different times can't occupy the same space",
          body: "This movie raises interesting sci-fi questions...",
          upvotes: 344,
          comments: 100,
          icon: "https://www.redditstatic.com/avatars/avatar_default_03_46A508.png"
        }
      ];

      setTimeout(() => {
        setPosts(data);
        setLoading(false);
      }, 700); // fake loading effect
    }

    loadData();
  }, []);

  if (loading)
    return (
      <p className="text-center text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
        Loading…
      </p>
    );

  return (
    <div
      className="
        w-full 
        max-w-[740px] 
        flex flex-col gap-4 
        bg-reddit-page 
        dark:bg-reddit-dark_bg 
        transition-colors duration-200
      "
    >
      {posts.map((post) => (
        <PostCard key={post.id} {...post} />
      ))}
    </div>
  );
}
