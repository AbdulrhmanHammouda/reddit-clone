// src/components/CommunitySidebar.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

function Card({ children }) {
  return (
    <div className="bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-xl p-4 shadow-sm">
      {children}
    </div>
  );
}

export default function CommunitySidebar({ community }) {
  const navigate = useNavigate();

  if (!community) return null;

  const isOwner = !!community.isOwner;

  const membersCount =
    community.membersCount ??
    (Array.isArray(community.members) ? community.members.length : 0);

  const rules = Array.isArray(community.rules)
    ? community.rules
    : community.rules
    ? [community.rules]
    : [];

  return (
    <div className="space-y-4">
      {/* small hero card */}
      <Card>
        <div className="flex items-center gap-3">
          <img
            src={community.icon}
            alt={community.name}
            className="h-12 w-12 rounded-md object-cover"
          />
          <div className="flex-1">
            <div className="font-semibold text-reddit-text dark:text-reddit-dark_text">
              {community.title}
            </div>
            <div className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
              {community.description}
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => navigate(`/r/${community.name}/moderation`)}
              className="bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-full px-3 py-1 text-sm hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition"
            >
              Mod Tools
            </button>
          </div>
        )}
      </Card>

      {/* About */}
      <Card>
        <h3 className="font-semibold mb-2 text-reddit-text dark:text-reddit-dark_text">
          About
        </h3>
        <p className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
          {community.description}
        </p>
      </Card>

      {/* Stats */}
      <Card>
        <h3 className="font-semibold mb-2 text-reddit-text dark:text-reddit-dark_text">
          Stats
        </h3>
        <div className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
          <div className="mb-1">{membersCount.toLocaleString()} members</div>
          <div>{community.active ?? 0} currently online</div>
        </div>
      </Card>

      {/* Rules */}
      <Card>
        <h3 className="font-semibold mb-2 text-reddit-text dark:text-reddit-dark_text">
          Rules
        </h3>
        <ol className="list-decimal ml-5 text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary space-y-2">
          {rules.length > 0 ? (
            rules.map((r, i) => <li key={i}>{r}</li>)
          ) : (
            <li>No rules yet</li>
          )}
        </ol>
      </Card>
    </div>
  );
}
