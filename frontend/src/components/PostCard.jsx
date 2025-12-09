import {
  ChatBubbleBottomCenterTextIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import VoteButtons from "./VoteButtons";
import React from "react";

/**
 * PostCard
 * - Accepts either: <PostCard post={post} />   OR   <PostCard {...postFields} />
 * - Renders text/html body, images, videos and galleries.
 * - Uses VoteButtons for voting.
 */
export default function PostCard(props) {
  const navigate = useNavigate();

  // Support two calling styles:
  // 1) <PostCard post={post} />
  // 2) <PostCard {...post} />
  const incoming = props.post ?? props;

  // normalize fields
  const id = incoming._id ?? incoming.id ?? null;
  const title = incoming.title ?? "";
  const body = incoming.body ?? "";
  const score = Number(incoming.score ?? incoming.votes ?? incoming.upvotes ?? 0);
  const commentsCount = incoming.commentsCount ?? incoming.commentCount ?? incoming.comments ?? 0;

  // community may be object or just name
  const communityObj =
    typeof incoming.community === "string"
      ? { name: incoming.community }
      : incoming.community ?? {};
  const community = communityObj.name ?? communityObj.title ?? "unknown";

  const communityAvatar =
    communityObj.avatar ?? communityObj.icon ?? "https://www.redditstatic.com/avatars/avatar_default_02_46D160.png";

  // author may be object or string
  const authorObj =
    typeof incoming.author === "string" ? { username: incoming.author } : incoming.author ?? {};
  const author = authorObj.username ?? authorObj.name ?? "user";

  // createdAt formatting
  const createdAgo = incoming.createdAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
        new Date(incoming.createdAt)
      )
    : "recently";

  // Media: support imageUrl (string or array), images[], videoUrl, file type hints
  const images =
    incoming.imageUrl && Array.isArray(incoming.imageUrl)
      ? incoming.imageUrl
      : incoming.images && Array.isArray(incoming.images)
      ? incoming.images
      : incoming.imageUrl && typeof incoming.imageUrl === "string"
      ? [incoming.imageUrl]
      : [];

  const videoUrl = incoming.videoUrl ?? incoming.video ?? null;

  const externalUrl = incoming.url ?? null;

  // safeguard
  if (!incoming || (typeof incoming !== "object")) return null;

  return (
    <div className="w-full max-w-[740px] bg-reddit-card dark:bg-reddit-dark_card rounded-xl p-4 border border-reddit-border dark:border-reddit-dark_divider shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between text-[13px]">
        <div className="flex items-center gap-2 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
          <Link to={`/r/${community}`} onClick={(e) => e.stopPropagation()} className="h-6 w-6">
            <img src={communityAvatar} className="h-full w-full rounded-full object-cover" />
          </Link>

          <Link
            to={`/r/${community}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-reddit-text dark:text-reddit-dark_text hover:underline"
          >
            r/{community}
          </Link>

          <span>•</span>

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

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => e.stopPropagation()}
            className="bg-reddit-blue hover:bg-reddit-blue_hover text-white text-xs font-semibold px-3 py-1 rounded-full"
          >
            Join
          </button>
          <button onClick={(e) => e.stopPropagation()} className="p-1 rounded-full">
            <EllipsisHorizontalIcon className="h-5 w-5 text-reddit-icon dark:text-reddit-dark_icon" />
          </button>
        </div>
      </div>

      {/* TITLE */}
      <h2
        className="mt-2 text-[18px] font-semibold text-reddit-text dark:text-reddit-dark_text leading-6 cursor-pointer hover:underline"
        onClick={() => navigate(`/post/${id}`)}
      >
        {title}
      </h2>

      {/* MEDIA (video first, then images) */}
      {videoUrl ? (
        <div
          className="mt-3 w-full rounded-md overflow-hidden border border-reddit-border dark:border-reddit-dark_divider"
          onClick={() => navigate(`/post/${id}`)}
        >
          <video
            controls
            src={videoUrl}
            className="w-full max-h-[480px] object-contain bg-black"
            playsInline
          />
        </div>
      ) : images.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {images.length === 1 ? (
            <div
              className="w-full rounded-md overflow-hidden border border-reddit-border dark:border-reddit-dark_divider"
              onClick={() => navigate(`/post/${id}`)}
            >
              <img
                src={images[0]}
                alt={title || "post image"}
                className="w-full max-h-[420px] object-cover"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {images.slice(0, 4).map((src, idx) => (
                <div
                  key={idx}
                  className="rounded-md overflow-hidden border border-reddit-border dark:border-reddit-dark_divider cursor-pointer"
                  onClick={() => navigate(`/post/${id}`)}
                >
                  <img src={src} alt={`img-${idx}`} className="w-full h-40 object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* BODY (HTML or plain text). If body looks like HTML we render it as HTML; otherwise plain text. */}
      {body && (
        <div
          className="mt-3 text-[15px] text-reddit-text_light dark:text-reddit-dark_text_light leading-snug whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      )}

      {/* External link preview (if no media and there's a URL) */}
      {!videoUrl && images.length === 0 && externalUrl && (
        <div
          className="mt-3 p-3 rounded-md border border-reddit-border dark:border-reddit-dark_divider bg-reddit-hover dark:bg-reddit-dark_hover cursor-pointer"
          onClick={() => window.open(externalUrl, "_blank")}
        >
          <div className="text-sm font-medium text-reddit-text break-all">{externalUrl}</div>
        </div>
      )}

      {/* ACTION BAR */}
      <div className="flex items-center gap-4 mt-3">
        <div onClick={(e) => e.stopPropagation()}>
          <VoteButtons postId={incoming._id ?? incoming.id} initialScore={score} initialVote={incoming.yourVote ?? 0} />
        </div>

        <div
          className="flex items-center gap-1 bg-reddit-hover dark:bg-reddit-dark_hover px-3 py-[6px] rounded-full text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary cursor-pointer hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/post/${id}`);
          }}
        >
          <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-reddit-icon" />
          <span>{commentsCount}</span>
        </div>

        <div
          className="flex items-center gap-1 bg-reddit-hover dark:bg-reddit-dark_hover px-3 py-[6px] rounded-full text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary cursor-pointer hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
          onClick={(e) => {
            e.stopPropagation();
            try {
              navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
            } catch (err) {
              console.warn("clipboard failed", err);
            }
          }}
        >
          <ShareIcon className="h-4 w-4 text-reddit-icon" />
          <span>Share</span>
        </div>
      </div>
    </div>
  );
}
