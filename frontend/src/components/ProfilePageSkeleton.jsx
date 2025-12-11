// src/components/ProfilePageSkeleton.jsx
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
      <div className="flex items-center gap-3 mb-3">
        <SkeletonPulse className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-3 w-32" />
          <SkeletonPulse className="h-2 w-20" />
        </div>
      </div>
      <SkeletonPulse className="h-5 w-3/4 mb-2" />
      <SkeletonPulse className="h-4 w-1/2 mb-4" />
      <SkeletonPulse className="h-32 w-full rounded-lg mb-3" />
      <div className="flex gap-4">
        <SkeletonPulse className="h-8 w-24 rounded-full" />
        <SkeletonPulse className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

function SidebarCardSkeleton() {
  return (
    <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-2xl border border-reddit-border dark:border-reddit-dark_divider p-4">
      <div className="flex items-center gap-3 mb-4">
        <SkeletonPulse className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-4 w-24" />
          <SkeletonPulse className="h-3 w-16" />
        </div>
      </div>
      <SkeletonPulse className="h-10 w-full rounded-full mb-4" />
      <div className="flex justify-between">
        <SkeletonPulse className="h-12 w-16" />
        <SkeletonPulse className="h-12 w-16" />
        <SkeletonPulse className="h-12 w-16" />
      </div>
    </div>
  );
}

export default function ProfilePageSkeleton() {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-6xl px-4 md:px-6 pt-6 pb-10">
        {/* Banner Skeleton */}
        <SkeletonPulse className="w-full h-32 rounded-xl mb-4" />

        {/* Header section */}
        <div className="flex items-center gap-4 mb-6 -mt-12 px-4">
          <SkeletonPulse className="h-24 w-24 rounded-full border-4 border-reddit-card dark:border-reddit-dark_card" />
          <div className="space-y-2 pt-8">
            <SkeletonPulse className="h-7 w-48" />
            <SkeletonPulse className="h-4 w-32" />
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex gap-6 mb-6 px-4">
          <SkeletonPulse className="h-12 w-20" />
          <SkeletonPulse className="h-12 w-20" />
          <SkeletonPulse className="h-12 w-24" />
        </div>

        {/* Content Grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1 lg:flex-[2] space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <SkeletonPulse className="h-10 w-24 rounded-full" />
              <SkeletonPulse className="h-10 w-20 rounded-full" />
              <SkeletonPulse className="h-10 w-24 rounded-full" />
            </div>

            {/* Posts */}
            <PostSkeleton />
            <PostSkeleton />
          </div>

          {/* Sidebar */}
          <aside className="lg:w-[320px]">
            <SidebarCardSkeleton />
          </aside>
        </div>
      </div>
    </div>
  );
}
