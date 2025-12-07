// src/components/PostCard.jsx
import {
  ChatBubbleBottomCenterTextIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import VoteButtons from "./VoteButtons";

export default function PostCard({ post }) {
  const navigate = useNavigate();
  if (!post) return null;

  const id = post._id;
  const title = post.title;
  const score = post.score ?? 0;
  const commentsCount = post.commentsCount ?? 0;

  const community = post.community?.name ?? "unknown";
  const communityIcon =
    post.community?.icon ??
    "https://www.redditstatic.com/avatars/avatar_default_02_46D160.png";

  const author = post.author?.username ?? "user";

  const createdAgo = post.createdAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(post.createdAt))
    : "recently";

  return (
    <div
      className="w-full max-w-[740px]
        bg-reddit-card dark:bg-reddit-dark_card
        rounded-xl p-4 border border-reddit-border dark:border-reddit-dark_divider
        shadow-sm cursor-pointer hover:border-reddit-blue"
      onClick={() => navigate(`/post/${id}`)}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between text-xs">

        <div className="flex items-center gap-2 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">

          {/* Community icon */}
          <Link
            to={`/r/${community}`}
            onClick={(e) => e.stopPropagation()}
            className="h-6 w-6"
          >
            <img
              src={communityIcon}
              className="h-6 w-6 rounded-full"
              alt="c"
            />
          </Link>

          {/* Community name */}
          <Link
            to={`/r/${community}`}
            onClick={(e) => e.stopPropagation()}
            className="font-semibold hover:underline"
          >
            r/{community}
          </Link>

          <span>•</span>

          {/* Author */}
          <Link
            to={`/u/${author}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:underline"
          >
            u/{author}
          </Link>

          <span>•</span>
          <span>{createdAgo}</span>
        </div>

        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1 rounded-full hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
        >
          <EllipsisHorizontalIcon className="h-5 w-5 text-reddit-icon dark:text-reddit-dark_icon" />
        </button>
      </div>

      {/* TITLE */}
      <h2 className="mt-2 text-[18px] font-semibold text-reddit-text dark:text-reddit-dark_text">
        {title}
      </h2>

      {/* BODY (Markdown) */}
      {post.body && (
        <div className="prose prose-invert mt-2 text-[15px]">
          <ReactMarkdown>{post.body}</ReactMarkdown>
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex items-center gap-4 mt-4" onClick={(e) => e.stopPropagation()}>

        {/* Votes */}
        <VoteButtons postId={id} initialScore={score} />

        {/* Comments */}
        <div
          className="flex items-center gap-1 bg-reddit-hover dark:bg-reddit-dark_hover px-3 py-[6px] rounded-full text-sm"
          onClick={() => navigate(`/post/${id}`)}
        >
          <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
          <span>{commentsCount}</span>
        </div>

        {/* Share */}
        <div
          className="flex items-center gap-1 bg-reddit-hover dark:bg-reddit-dark_hover px-3 py-[6px] rounded-full text-sm cursor-pointer"
          onClick={() =>
            navigator.clipboard.writeText(
              `${window.location.origin}/post/${id}`
            )
          }
        >
          <ShareIcon className="h-4 w-4" />
          <span>Share</span>
        </div>

      </div>
    </div>
  );
}
