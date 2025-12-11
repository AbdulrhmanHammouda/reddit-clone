// src/components/CommunityHeader.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  UserGroupIcon,
  CalendarIcon,
  BellIcon,
  PlusIcon,
  Cog6ToothIcon,
  PencilIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { BellIcon as BellSolidIcon } from "@heroicons/react/24/solid";
import defaultProfileImg from "../assets/default_profile.jpeg";
import defaultBanner from "../assets/default_banner.jpeg";

// Format member count (e.g., 1234 -> "1.2K")
function formatCount(num) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

// Format date (e.g., "Dec 10, 2024")
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CommunityHeader({
  community = {},
  onJoin,
  onCreatePost,
  joinLoading,
  onEditCommunity,
}) {
  const navigate = useNavigate();

  const isOwner = !!community.isOwner;
  const isMember = !!community.isMember;
  const membersCount = community.membersCount ?? 0;
  const createdAt = community.createdAt;

  return (
    <div className="mt-4">
      {/* Banner */}
      <div className="w-full h-40 rounded-xl overflow-hidden bg-gradient-to-r from-reddit-blue to-purple-600 border border-reddit-border dark:border-reddit-dark_divider relative">
        <img
          src={community.banner || defaultBanner}
          alt="Community banner"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Profile section */}
      <div className="relative px-4 -mt-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          {/* Left: Avatar + Info */}
          <div className="flex items-end gap-4">
            {/* Avatar */}
            <div className="bg-reddit-card dark:bg-reddit-dark_card border-4 border-reddit-card dark:border-reddit-dark_card rounded-full shadow-lg">
              <img
                src={
                  community.icon && community.icon !== "/default-community.png"
                    ? community.icon
                    : defaultProfileImg
                }
                alt={community.name}
                className="h-24 w-24 rounded-full object-cover"
              />
            </div>

            {/* Community info */}
            <div className="pb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-reddit-text dark:text-reddit-dark_text">
                {community.title || community.name}
              </h1>
              <p className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                r/{community.name}
              </p>
            </div>
          </div>

          {/* Right: Stats + Actions */}
          <div className="flex flex-wrap items-center gap-4 pb-2">
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5 text-reddit-text dark:text-reddit-dark_text">
                <UserGroupIcon className="h-5 w-5 text-reddit-text_secondary" />
                <span className="font-semibold">{formatCount(membersCount)}</span>
                <span className="text-reddit-text_secondary">members</span>
              </div>
              {createdAt && (
                <div className="hidden sm:flex items-center gap-1.5 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Created {formatDate(createdAt)}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Create Post */}
              <button
                onClick={onCreatePost}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-reddit-border dark:border-reddit-dark_divider hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Create Post</span>
              </button>

              {/* Join/Joined Button (not owner) */}
              {!isOwner && onJoin && (
                <button
                  onClick={onJoin}
                  disabled={joinLoading}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    isMember
                      ? "border border-reddit-border dark:border-reddit-dark_divider bg-reddit-card dark:bg-reddit-dark_card hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
                      : "bg-reddit-blue text-white hover:bg-reddit-blue_hover"
                  } ${joinLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {joinLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </span>
                  ) : isMember ? (
                    "Joined"
                  ) : (
                    "Join"
                  )}
                </button>
              )}

              {/* Notification Bell (for members) */}
              {isMember && !isOwner && (
                <button
                  className="h-10 w-10 rounded-full border border-reddit-border dark:border-reddit-dark_divider flex items-center justify-center hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
                  title="Notifications"
                >
                  <BellIcon className="h-5 w-5" />
                </button>
              )}

              {/* Owner Controls */}
              {isOwner && (
                <>
                  <button
                    onClick={() => navigate(`/r/${community.name}/moderation`)}
                    className="h-10 w-10 rounded-full border border-reddit-border dark:border-reddit-dark_divider flex items-center justify-center hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
                    title="Mod Tools"
                  >
                    <Cog6ToothIcon className="h-5 w-5" />
                  </button>

                  <button
                    onClick={onEditCommunity}
                    className="h-10 w-10 rounded-full border border-reddit-border dark:border-reddit-dark_divider flex items-center justify-center hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
                    title="Edit community"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* More options */}
              <button
                className="h-10 w-10 rounded-full border border-reddit-border dark:border-reddit-dark_divider flex items-center justify-center hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
                title="More options"
              >
                <EllipsisHorizontalIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Description (if exists) */}
        {community.description && (
          <p className="mt-3 text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary max-w-2xl">
            {community.description}
          </p>
        )}
      </div>
    </div>
  );
}
