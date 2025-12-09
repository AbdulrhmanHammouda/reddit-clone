import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import VoteButtons from "./VoteButtons";
import CommentReplyBox from "./CommentReplyBox";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";

// Collapse icons
import {
  ChevronDownIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/solid";

// Share icon
import {
  ShareIcon as ShareOutline,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function Comment({ comment, postId, onDelete }) {
  const { token, user } = useAuth(); // Destructure user from useAuth

  const [showReply, setShowReply] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);

  const [menuOpen, setMenuOpen] = useState(false); // State for ellipsis menu
  const [saved, setSaved] = useState(comment.saved || false); // State for saved status
  const [showDeleteModal, setShowDeleteModal] = useState(false); // State for delete modal

  const menuRef = useRef(null); // Ref for ellipsis menu

  useEffect(() => {
    function onDocDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [menuOpen]);

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

  function handleShare() {
    const url = `${window.location.origin}/comments/${commentId}`; // Assuming comments have their own page or link to post with comment ID
    if (navigator.share) {
      navigator.share({ title: "Check out this comment!", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  }

  async function toggleSave() {
    if (!token) return alert("Login to save comments");
    try {
      if (!saved) {
        await api.post(`/comments/${commentId}/save`);
        setSaved(true);
      } else {
        await api.delete(`/comments/${commentId}/save`);
        setSaved(false);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function onDeleteClick() {
    setShowDeleteModal(true);
    setMenuOpen(false);
  }

  async function onDeleteConfirm() {
    if (!token) return;
    try {
      await api.delete(`/comments/${commentId}`);
      // Notify parent to remove comment from UI
      if (onDelete) {
        onDelete(commentId);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete comment.");
    } finally {
      setShowDeleteModal(false);
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

        <div className="flex-1 relative">

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

            {/* Ellipsis Menu - TOP RIGHT */}
            <div className="absolute top-0 right-0" ref={menuRef}>
              <button onClick={() => setMenuOpen(v => !v)} className="p-1 rounded-full hover:bg-[#e8e9eb] dark:hover:bg-[#2c2d2f]">
                <EllipsisHorizontalIcon className="h-5 w-5 text-reddit-icon dark:text-reddit-dark_icon" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded shadow-lg z-30">
                  <button onClick={handleShare} className="w-full text-left px-3 py-2 hover:bg-[#e8e9eb] dark:hover:bg-[#2c2d2f] flex items-center gap-2">
                    <ShareOutline className="h-4 w-4" /> Share
                  </button>

                  {token && (
                    <button onClick={toggleSave} className="w-full text-left px-3 py-2 hover:bg-[#e8e9eb] dark:hover:bg-[#2c2d2f]">
                      {saved ? "Unsave" : "Save"}
                    </button>
                  )}

                  {/* Only show delete if current user is the author */}
                  {user && comment.author?._id === user._id && (
                    <button
                      onClick={onDeleteClick}
                      className="w-full text-left px-3 py-2 hover:bg-red-600 hover:text-white"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
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
              onDelete={onDelete} // Pass onDelete to nested comments
            />
          ))}
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0b1113] p-6 rounded-2xl w-[430px] relative text-white">
            <button className="absolute top-3 right-3 p-1" onClick={() => setShowDeleteModal(false)}>
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold mb-2">Delete comment?</h3>
            <p className="text-sm opacity-60 mb-6">
              Once you delete this comment, it can’t be restored.
            </p>

            <div className="flex justify-end gap-3">
              <button className="px-5 py-2 rounded-full bg-[#1f2933] hover:bg-[#2b3940]" onClick={() => setShowDeleteModal(false)}>
                Go Back
              </button>

              <button className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white" onClick={onDeleteConfirm}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
