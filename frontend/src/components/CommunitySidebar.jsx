// src/components/CommunitySidebar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserGroupIcon,
  CalendarIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import defaultProfileImg from "../assets/default_profile.jpeg";

// Format member count
function formatCount(num) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-xl overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-reddit-border dark:border-reddit-dark_divider bg-reddit-hover/30 dark:bg-reddit-dark_hover/30">
      {Icon && <Icon className="h-5 w-5 text-reddit-text_secondary" />}
      <h3 className="font-semibold text-sm text-reddit-text dark:text-reddit-dark_text">
        {title}
      </h3>
    </div>
  );
}

export default function CommunitySidebar({ community, onCreatePost }) {
  const navigate = useNavigate();
  const [rulesExpanded, setRulesExpanded] = useState(true);

  if (!community) return null;

  const isOwner = !!community.isOwner;
  const membersCount = community.membersCount ?? 0;
  const activeCount = (community.active ?? Math.floor(membersCount * 0.01)) || 1;
  const createdAt = community.createdAt;

  const rules = Array.isArray(community.rules)
    ? community.rules
    : (community.rules ? [community.rules] : []);

  // Use actual moderators from API, or empty array if not available
  const moderators = community.moderators || [];

  return (
    <div className="space-y-4">
      {/* About Card */}
      <Card>
        <CardHeader icon={InformationCircleIcon} title="About Community" />
        <div className="p-4">
          <p className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary mb-4">
            {community.description || "Welcome to this community!"}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-reddit-border dark:border-reddit-dark_divider">
            <div>
              <div className="font-bold text-lg text-reddit-text dark:text-reddit-dark_text">
                {formatCount(membersCount)}
              </div>
              <div className="text-xs text-reddit-text_secondary">Members</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-bold text-lg text-reddit-text dark:text-reddit-dark_text">
                  {formatCount(activeCount)}
                </span>
              </div>
              <div className="text-xs text-reddit-text_secondary">Online</div>
            </div>
          </div>

          {/* Creation Date */}
          {createdAt && (
            <div className="flex items-center gap-2 mt-3 text-sm text-reddit-text_secondary">
              <CalendarIcon className="h-4 w-4" />
              <span>Created {formatDate(createdAt)}</span>
            </div>
          )}

          {/* Create Post Button */}
          <button
            onClick={() =>
              navigate(`/createpost?community=${encodeURIComponent(community.name)}`)
            }
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-full bg-reddit-blue text-white font-semibold text-sm hover:bg-reddit-blue_hover transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Create Post
          </button>
        </div>
      </Card>

      {/* Rules Card */}
      <Card>
        <button
          onClick={() => setRulesExpanded(!rulesExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
        >
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-reddit-text_secondary" />
            <h3 className="font-semibold text-sm text-reddit-text dark:text-reddit-dark_text">
              r/{community.name} Rules
            </h3>
          </div>
          {rulesExpanded ? (
            <ChevronUpIcon className="h-4 w-4 text-reddit-text_secondary" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-reddit-text_secondary" />
          )}
        </button>

        {rulesExpanded && (
          <div className="px-4 pb-4">
            {rules.length > 0 ? (
              <ol className="space-y-2">
                {rules.map((rule, i) => (
                  <li
                    key={i}
                    className="flex gap-3 py-2 border-b border-reddit-border dark:border-reddit-dark_divider last:border-0"
                  >
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-reddit-hover dark:bg-reddit-dark_hover flex items-center justify-center text-xs font-semibold">
                      {i + 1}
                    </span>
                    <span className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                      {rule}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-reddit-text_secondary italic">
                No rules set for this community
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Moderators Card - only show if moderators exist */}
      {moderators.length > 0 && (
      <Card>
        <CardHeader icon={ShieldCheckIcon} title="Moderators" />
        <div className="p-4">
          <ul className="space-y-3">
            {moderators.slice(0, 5).map((mod, i) => (
              <li key={i} className="flex items-center gap-2">
                <img
                  src={mod.avatar || defaultProfileImg}
                  alt={mod.username}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium text-reddit-text dark:text-reddit-dark_text truncate hover:underline cursor-pointer"
                    onClick={() => navigate(`/u/${mod.username}`)}
                  >
                    u/{mod.username}
                  </div>
                  {mod.role && (
                    <div className="text-xs text-reddit-text_secondary capitalize">
                      {mod.role}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {moderators.length > 5 && (
            <button className="mt-3 text-sm text-reddit-blue hover:underline">
              View all moderators
            </button>
          )}
        </div>
      </Card>
      )}
      {isOwner && (
        <Card>
          <div className="p-4">
            <button
              onClick={() => navigate(`/r/${community.name}/moderation`)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-reddit-border dark:border-reddit-dark_divider font-semibold text-sm hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              Mod Tools
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
