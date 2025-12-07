import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function CommunityHeader({ community = {}, onJoin, onCreatePost }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // owner detection: check memberRole first, then createdBy vs logged-in user id
  const isOwner = useMemo(() => {
    if (!community) return false;
    if (community.memberRole === "owner") return true;
    if (!user || !community.createdBy) return false;
    const createdBy = community.createdBy;
    // createdBy might be an ObjectId or string; user may have id or _id
    const createdByStr = createdBy?.toString ? createdBy.toString() : createdBy;
    const userId = user?.id ?? user?._id ?? null;
    return userId && createdByStr === userId.toString();
  }, [community, user]);

const isMember = community?.isOwner || community?.isMember;

  return (
    <div className="mt-6">
      {/* banner area */}
      <div
        className={`w-full h-36 rounded-md overflow-hidden bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider`}
      >
        {community?.banner ? (
          <img
            src={community.banner}
            alt="community banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

      {/* avatar + title + actions */}
      <div className="flex items-center justify-between -mt-6">
        <div className="flex items-center gap-4">
          <div className="bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-full p-1 shadow-sm">
            <img
              src={community?.icon}
              alt={community?.name}
              className="h-20 w-20 rounded-full object-cover"
            />
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-reddit-text dark:text-reddit-dark_text leading-tight">
              {community?.title}
            </h2>
            <p className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary mt-1">
              {community?.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Create Post always available */}
          <button
            onClick={onCreatePost}
            className="bg-transparent border border-reddit-border dark:border-reddit-dark_divider rounded-full px-4 py-2 text-sm hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition"
          >
            Create Post
          </button>

          {/* Show Join / Joined only if NOT owner */}
          {!isOwner && (
            <button
              onClick={onJoin}
              className={
                isMember
                  ? "bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-full px-4 py-2 text-sm hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition"
                  : "bg-reddit-blue hover:bg-reddit-blue_hover text-reddit-card font-semibold px-4 py-2 rounded-full text-sm transition"
              }
            >
              {isMember ? "Joined" : "Join"}
            </button>
          )}

          {/* Owner-only controls: Mod Tools + Edit pencil */}
          {isOwner && (
            <>
              <button
                onClick={() => navigate(`/r/${community.name}/moderation`)}
                className="h-10 rounded-full bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider px-3 py-2 text-sm hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition"
                title="Mod Tools"
              >
                Mod Tools
              </button>

              <button
                onClick={() => navigate(`/r/${community.name}/edit`)}
                className="h-10 w-10 rounded-full bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider flex items-center justify-center"
                title="Edit community"
              >
                <span className="text-reddit-icon dark:text-reddit-dark_icon">✏️</span>
              </button>
            </>
          )}

          <button className="h-10 w-10 rounded-full bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider flex items-center justify-center">
            <span className="text-reddit-icon dark:text-reddit-dark_icon">⋯</span>
          </button>
        </div>
      </div>

      {/* small sort/view row (below header) */}
      <div className="mt-4 border-t border-reddit-divider dark:border-reddit-dark_divider pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="px-3 py-1 rounded-md bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider text-sm">
            Best
          </button>
          <button className="px-3 py-1 rounded-md text-sm hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover">
            Hot
          </button>
          <button className="px-3 py-1 rounded-md text-sm hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover">
            New
          </button>
        </div>

        <div className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
          <span className="mr-4 hidden sm:inline">View</span>
          <span>Sort: Best</span>
        </div>
      </div>
    </div>
  );
}
