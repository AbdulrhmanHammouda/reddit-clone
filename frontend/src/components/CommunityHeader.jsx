// src/components/CommunityHeader.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function CommunityHeader({
  community = {},
  onJoin,
  onCreatePost,
  joinLoading,
  onEditCommunity
}) {
  const navigate = useNavigate();

  const isOwner = !!community.isOwner;
  const isMember = !!community.isMember;

  return (
    <div className="mt-6">
      {/* banner */}
      <div className="w-full h-36 rounded-md overflow-hidden bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider">
        {community.banner ? (
          <img
            src={community.banner}
            alt="banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

      {/* avatar + name + actions */}
      <div className="flex items-center justify-between -mt-6">
        <div className="flex items-center gap-4">
          <div className="bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-full p-1 shadow-sm">
            <img
              src={community.icon}
              alt={community.name}
              className="h-20 w-20 rounded-full object-cover"
            />
          </div>

          <div>
            <h2 className="text-3xl font-extrabold">{community.title}</h2>
            <p className="text-sm opacity-80">{community.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Create post */}
          <button
            onClick={onCreatePost}
            className="border rounded-full px-4 py-2 text-sm hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
          >
            Create Post
          </button>

          {/* Join Button (not owner) */}
          {!isOwner && onJoin && (
            <button
              onClick={onJoin}
              disabled={joinLoading}
              className={
                isMember
                  ? "border rounded-full px-4 py-2 text-sm bg-reddit-card dark:bg-reddit-dark_card"
                  : "rounded-full px-4 py-2 text-sm bg-reddit-blue text-white"
              }
            >
              {joinLoading ? "..." : isMember ? "Joined" : "Join"}
            </button>
          )}

          {/* Owner ONLY */}
          {isOwner && (
            <>
              {/* Mod Tools */}
              <button
                onClick={() =>
                  navigate(`/r/${community.name}/moderation`)
                }
                className="border rounded-full px-3 py-2 text-sm"
                title="Mod Tools"
              >
                ⚙️
              </button>

              {/* Edit Community */}
              <button
                onClick={onEditCommunity}
                className="h-10 w-10 rounded-full border flex items-center justify-center"
                title="Edit community"
              >
                ✏️
              </button>
            </>
          )}

          {/* More */}
          <button className="h-10 w-10 rounded-full border flex items-center justify-center">
            ⋯
          </button>
        </div>
      </div>

    </div>
  );
}
