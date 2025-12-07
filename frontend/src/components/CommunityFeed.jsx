// src/components/CommunityFeed.jsx
import PostCard from "./PostCard";

export default function CommunityFeed({ posts = [], createPost }) {
  if (!posts.length) {
    return (
      <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-xl p-6 border border-reddit-border dark:border-reddit-dark_divider shadow-sm text-reddit-text_secondary">
        No posts yet. Be the first to{" "}
        <button
          onClick={() => createPost && createPost()}
          className="underline text-reddit-text hover:no-underline"
        >
          create a post
        </button>
        .
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
