// src/components/CommunityFeed.jsx
import React from "react";
import { DocumentTextIcon, PlusIcon } from "@heroicons/react/24/outline";
import PostCard from "./PostCard";

export default function CommunityFeed({ posts = [], createPost, onToggleSave, onDelete, communityName }) {
  return (
    <div className="flex flex-col gap-3">
      {posts.map((p) => (
        <PostCard
          key={p._id || p.id}
          post={p}
          onToggleSave={(saved) => onToggleSave(p._id || p.id, saved)}
          onDelete={onDelete}
        />
      ))}

      {/* Enhanced empty state */}
      {posts.length === 0 && (
        <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-xl p-8 border border-reddit-border dark:border-reddit-dark_divider shadow-sm text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-reddit-hover dark:bg-reddit-dark_hover flex items-center justify-center">
              <DocumentTextIcon className="h-8 w-8 text-reddit-text_secondary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-reddit-text dark:text-reddit-dark_text mb-2">
            No posts yet
          </h3>
          <p className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary mb-4">
            Be the first one to share something with this community!
          </p>
          <button
            onClick={() => createPost && createPost()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-reddit-blue text-white font-medium text-sm hover:bg-reddit-blue_hover transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Create a Post
          </button>
        </div>
      )}
    </div>
  );
}
