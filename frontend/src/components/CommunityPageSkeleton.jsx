// src/components/CommunityPageSkeleton.jsx
import React from "react";

function SkeletonPulse({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-reddit-hover dark:bg-reddit-dark_hover rounded ${className}`}
    />
  );
}

function PostSkeleton() {
  return (
    <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-xl p-4 border border-reddit-border dark:border-reddit-dark_divider">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <SkeletonPulse className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-3 w-32" />
          <SkeletonPulse className="h-2 w-20" />
        </div>
      </div>
      {/* Title */}
      <SkeletonPulse className="h-5 w-3/4 mb-2" />
      <SkeletonPulse className="h-4 w-1/2 mb-4" />
      {/* Content */}
      <SkeletonPulse className="h-48 w-full rounded-lg mb-3" />
      {/* Actions */}
      <div className="flex gap-4">
        <SkeletonPulse className="h-8 w-24 rounded-full" />
        <SkeletonPulse className="h-8 w-24 rounded-full" />
        <SkeletonPulse className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

function SidebarCardSkeleton({ rows = 3 }) {
  return (
    <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-xl border border-reddit-border dark:border-reddit-dark_divider overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-reddit-border dark:border-reddit-dark_divider">
        <SkeletonPulse className="h-4 w-32" />
      </div>
      {/* Content */}
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonPulse key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function CommunityPageSkeleton() {
  return (
    <div className="bg-reddit-page dark:bg-reddit-dark_bg min-h-screen">
      <div className="mx-auto w-full max-w-[1200px] px-4 lg:px-6">
        {/* Banner Skeleton */}
        <div className="mt-4">
          <SkeletonPulse className="w-full h-40 rounded-xl" />

          {/* Profile section */}
          <div className="relative px-4 -mt-10">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <SkeletonPulse className="h-24 w-24 rounded-full border-4 border-reddit-card dark:border-reddit-dark_card" />
              {/* Info */}
              <div className="pb-2 space-y-2">
                <SkeletonPulse className="h-8 w-48" />
                <SkeletonPulse className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Posts Column */}
          <div className="lg:col-span-2 flex justify-center">
            <div className="w-full max-w-[740px] space-y-4">
              {/* Sort menu skeleton */}
              <div className="flex items-center gap-2">
                <SkeletonPulse className="h-9 w-24 rounded-full" />
                <SkeletonPulse className="h-9 w-20 rounded-full" />
              </div>

              {/* Post skeletons */}
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </div>
          </div>

          {/* Sidebar Column */}
          <aside className="hidden lg:block">
            <div className="w-[320px] space-y-4">
              <SidebarCardSkeleton rows={4} />
              <SidebarCardSkeleton rows={3} />
              <SidebarCardSkeleton rows={2} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
