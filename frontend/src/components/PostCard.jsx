// src/components/PostCard.jsx
import {
  ChatBubbleBottomCenterTextIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import VoteButtons from "./VoteButtons";

export default function PostCard({ post }) {
  const navigate = useNavigate();

  if (!post || typeof post !== "object") return null;

  // ---------- basic fields ----------
  const id = post._id;
  const title = post.title ?? "";
  const body = post.body ?? "";
  const score = Number(post.score ?? post.votes ?? 0);
  const commentsCount = post.commentsCount ?? post.commentCount ?? 0;

  const community = post.community?.name ?? "unknown";
  const communityTitle = post.community?.title ?? community;
  const communityAvatar =
    post.community?.icon ||
    post.community?.avatar ||
    "https://www.redditstatic.com/avatars/avatar_default_02_46D160.png";

  const author = post.author?.username ?? "user";

  // ---------- dates ----------
  const createdAgo = post.createdAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(post.createdAt))
    : "recently";

  // ---------- handlers ----------
  const handleOpenPost = () => {
    if (!id) return;
    navigate(`/post/${id}`);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${id}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    } else {
      // fallback: open in new tab
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className="
        w-full max-w-[740px]
        bg-reddit-card dark:bg-reddit-dark_card
        rounded-xl p-4
        border border-reddit-border dark:border-reddit-dark_divider
        shadow-sm
      "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between text-[13px]">
        {/* LEFT SIDE: community + author */}
        <div className="flex items-center gap-2 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
          {/* Community Icon */}
          <Link
            to={`/r/${community}`}
            onClick={(e) => e.stopPropagation()}
            className="h-6 w-6 flex-shrink-0"
          >
            <img
              src={communityAvatar}
              alt={communityTitle}
              className="h-full w-full rounded-full object-cover"
            />
          </Link>

          {/* Community Name */}
          <Link
            to={`/r/${community}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-reddit-text dark:text-reddit-dark_text hover:underline"
          >
            r/{community}
          </Link>

          <span>•</span>

          {/* Author */}
          <Link
            to={`/u/${author}`}
            onClick={(e) => e.stopPropagation()}
            className="truncate max-w-[120px] hover:underline"
          >
            u/{author}
          </Link>

          <span>•</span>
          <span>{createdAgo}</span>
        </div>

        {/* RIGHT SIDE: menu (and optional join if you want for home feed) */}
        <div className="flex items-center gap-2">
          {/* If you only show Join on home feed, you can pass a prop later; for now hide it in community page */}
          {/* <button
            onClick={(e) => e.stopPropagation()}
            className="bg-reddit-blue hover:bg-reddit-blue_hover text-white text-xs font-semibold px-3 py-1 rounded-full"
          >
            Join
          </button> */}
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-full hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
          >
            <EllipsisHorizontalIcon className="h-5 w-5 text-reddit-icon dark:text-reddit-dark_icon" />
          </button>
        </div>
      </div>

      {/* TITLE */}
      <h2
        className="mt-2 text-[18px] font-semibold text-reddit-text dark:text-reddit-dark_text leading-6 cursor-pointer hover:underline"
        onClick={handleOpenPost}
      >
        {title}
      </h2>

      {/* BODY (Markdown) */}
      {body && (
        <div className="mt-2 text-[15px] leading-6 text-reddit-text_light dark:text-reddit-dark_text_light">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            urlTransform={(url) => url || ""}
            components={{
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-semibold" {...props} />
              ),
              em: ({ node, ...props }) => (
                <em className="italic" {...props} />
              ),
              code: ({ node, inline, ...props }) =>
                inline ? (
                  <code
                    className="px-1 py-[1px] rounded bg-reddit-hover dark:bg-reddit-dark_hover text-[13px]"
                    {...props}
                  />
                ) : (
                  <pre className="mt-2 p-2 rounded bg-reddit-hover dark:bg-reddit-dark_hover text-[13px] overflow-x-auto">
                    <code {...props} />
                  </pre>
                ),
              p: ({ node, ...props }) => <p className="mb-1" {...props} />,
              ul: ({ node, ...props }) => (
                <ul className="list-disc ml-5 mb-1" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal ml-5 mb-1" {...props} />
              ),
            }}
          >
            {body}
          </ReactMarkdown>
        </div>
      )}

      {/* ACTION BAR */}
      <div className="flex items-center gap-4 mt-3">
        {/* Votes */}
        <div onClick={(e) => e.stopPropagation()}>
          <VoteButtons initial={score} postId={id} />
        </div>

        {/* Comments Button */}
        <button
          type="button"
          className="
            flex items-center gap-1
            bg-reddit-hover dark:bg-reddit-dark_hover
            px-3 py-[6px] rounded-full
            text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary
            hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover
          "
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPost();
          }}
        >
          <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-reddit-icon dark:text-reddit-dark_icon" />
          <span>{commentsCount}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          className="
            flex items-center gap-1
            bg-reddit-hover dark:bg-reddit-dark_hover
            px-3 py-[6px] rounded-full
            text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary
            hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover
          "
          onClick={handleShare}
        >
          <ShareIcon className="h-4 w-4 text-reddit-icon dark:text-reddit-dark_icon" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}
