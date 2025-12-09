import { useState } from "react";
import { Link } from "react-router-dom";
import VoteButtons from "./VoteButtons";
import CommentReplyBox from "./CommentReplyBox";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";

// Collapse icons
import {
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";

export default function Comment({ comment, postId }) {
  const { token } = useAuth();

  const [showReply, setShowReply] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);

  // Normalized author
  const username =
    typeof comment.author === "string"
      ? comment.author
      : comment.author?.username || "user";

  const avatar =
    typeof comment.author === "object" ? comment.author?.avatar : null;

  const commentId = comment.id || comment._id;

async function handleReply(text, images = []) {
  if (!token) return;

  const formData = new FormData();
  formData.append("postId", postId);
  formData.append("body", text);
  formData.append("parent", commentId);

  images.forEach((file) => formData.append("images", file));

  try {
    const res = await api.post("/comments", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const saved = res.data.data;
    setReplies((prev) => [...prev, saved]);
    setShowReply(false);
  } catch (err) {
    console.error("Reply failed:", err.response?.data || err);
  }
}


  const created =
    comment.createdAt && !isNaN(Date.parse(comment.createdAt))
      ? new Date(comment.createdAt).toLocaleString()
      : "";

  return (
    <div className="bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-lg p-4 text-reddit-text dark:text-reddit-dark_text">

      {/* HEADER */}
      <div className="flex gap-3">

        {/* Avatar */}
        <Link
          to={`/u/${username}`}
          className="h-8 w-8 rounded-full overflow-hidden bg-reddit-hover dark:bg-reddit-dark_hover flex items-center justify-center font-semibold"
        >
          {avatar ? (
            <img src={avatar} className="h-full w-full object-cover" />
          ) : (
            username[0]?.toUpperCase()
          )}
        </Link>

        <div className="flex-1">

          {/* Username + Date */}
          <div className="text-sm flex items-center gap-2">
            <Link
              to={`/u/${username}`}
              className="font-semibold hover:underline"
            >
              {username}
            </Link>
            {created && (
              <span className="text-xs text-reddit-text_secondary">
                {created}
              </span>
            )}
          </div>

          {/* Comment text */}
          <div className="mt-2 whitespace-pre-wrap text-reddit-text_light dark:text-reddit-dark_text_light">
            {comment.body}
          </div>

          {/* Images */}
          {comment.images?.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {comment.images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  className="max-w-[180px] rounded-md border"
                  alt="comment"
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex gap-3 items-center text-sm">

            {/* Voting */}
            <VoteButtons
              commentId={commentId}
              initialScore={comment.score || 0}
              initialVote={comment.yourVote || 0}
            />

            {/* Collapse */}
            {replies.length > 0 && (
              <button
                onClick={() => setCollapsed((v) => !v)}
                className="p-1 rounded hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
              >
                {collapsed ? (
                  <ChevronRightIcon className="h-4 w-4 text-reddit-text_secondary dark:text-reddit-dark_text_secondary" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-reddit-text_secondary dark:text-reddit-dark_text_secondary" />
                )}
              </button>
            )}

            {/* Reply */}
            <button
              className="px-2 py-1 hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover rounded"
              onClick={() => setShowReply((v) => !v)}
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* Reply Box */}
      {showReply && (
        <div className="ml-12 mt-2">
          <CommentReplyBox
            onReply={handleReply}
            onCancel={() => setShowReply(false)}
          />
        </div>
      )}

      {/* Nested replies */}
      {replies.length > 0 && !collapsed && (
        <div className="ml-12 border-l border-reddit-border dark:border-reddit-dark_divider pl-4 mt-3 flex flex-col gap-3">
          {replies.map((reply) => (
            <Comment
              key={reply._id || reply.id}
              comment={reply}
              postId={postId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
