// src/components/CommunityFeed.jsx
import React from "react";
import PostCard from "./PostCard";

export default function CommunityFeed({ posts = [], createPost, onToggleSave }) {

  return (
    <div className="flex flex-col gap-4">
      {posts.map((p) => (
        <PostCard
          key={p._id || p.id}
          post={p}
          onToggleSave={(saved) => onToggleSave(p._id || p.id, saved)}
        />
      ))}

      {/* Placeholder when no posts */}
      {posts.length === 0 && (
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
      )}
    </div>
  );
}
