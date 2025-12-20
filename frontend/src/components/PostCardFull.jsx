// src/pages/PostPage.jsx  OR  src/components/PostCardFull.jsx
// (but make sure you only have ONE default PostCardFull in the project)

import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import VoteButtons from "../components/VoteButtons";
import {
  ChatBubbleBottomCenterTextIcon,
  EllipsisHorizontalIcon,
  ShareIcon as ShareOutline,
  PencilIcon,
  XMarkIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import useAuth from "../hooks/useAuth";
import ImageCarousel from "./ImageCarousel";
import FullscreenImageViewer from "./FullscreenImageViewer";
import RichTextEditor from "./RichTextEditor";
import { toast } from "react-hot-toast";
import AISummaryModal from "./AISummaryModal";
import defaultProfileImg from "../assets/default_profile.jpeg";

export default function PostCardFull({ post: incomingProp, postId: propPostId, onPostUpdate }) {
  const params = useParams(); // from /post/:id
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const incoming = incomingProp ?? {};
  const id = incoming._id ?? propPostId ?? params.id;

  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(incoming.saved || false);
  const [isMember, setIsMember] = useState(incoming.community?.isMember || false);
  const [isMod, setIsMod] = useState(incoming.community?.isMod || false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const menuRef = useRef(null);

  // Edit post state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(incoming.title || "");
  const [editBody, setEditBody] = useState(incoming.body || "");
  const [editLoading, setEditLoading] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(incoming.title || "");
  const [currentBody, setCurrentBody] = useState(incoming.body || "");

  // AI Summary state
  const [showAISummary, setShowAISummary] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!incoming) return;
    setSaved(incoming.saved || false);
    setIsMember(incoming.community?.isMember || false);
    setIsMod(incoming.community?.isMod || false);
    setViewerIndex(0);
    setCurrentTitle(incoming.title || "");
    setCurrentBody(incoming.body || "");
  }, [incoming]);

  async function toggleSave() {
    if (!token) {
      alert("Login to save posts");
      return;
    }
    try {
      if (!saved) {
        await api.post(`/posts/${id}/save`);
        setSaved(true);
      } else {
        await api.delete(`/posts/${id}/save`);
        setSaved(false);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  }

  async function onDelete() {
    if (!token) return;

    const ok = window.confirm("Delete this post? This action cannot be undone.");
    if (!ok) return;

    try {
      await api.delete(`/posts/${id}`);
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  }

  function handleShare() {
    if (!id) return;
    const url = `${window.location.origin}/post/${id}`;
    if (navigator.share) {
      navigator
        .share({ title: incoming?.title || "Post", url })
        .catch(() => {});
    } else {
      navigator.clipboard
        ?.writeText(url)
        .then(() => alert("Link copied to clipboard"))
        .catch(() => {
          window.prompt("Copy link", url);
        });
    }
  }

  function onEditClick() {
    setEditTitle(currentTitle);
    setEditBody(currentBody);
    setShowEditModal(true);
    setMenuOpen(false);
  }

  async function onEditSave() {
    if (!token || !editTitle.trim()) return;
    setEditLoading(true);
    try {
      const res = await api.patch(`/posts/${id}`, {
        title: editTitle.trim(),
        body: editBody,
      });
      if (res.data?.success) {
        setCurrentTitle(editTitle.trim());
        setCurrentBody(editBody);
        setShowEditModal(false);
        toast.success("Post updated!");
        onPostUpdate?.({ title: editTitle.trim(), body: editBody });
      }
    } catch (err) {
      console.error("Edit error:", err);
      toast.error(err.response?.data?.error || "Failed to update post");
    } finally {
      setEditLoading(false);
    }
  }

  if (!incoming || !id) return null;

  const videoUrl = incoming.videoUrl ?? null;
  const images =
    incoming.imageUrl && Array.isArray(incoming.imageUrl)
      ? incoming.imageUrl
      : incoming.images || [];

  const postId = incoming._id;
  const community = incoming.community?.name ?? "unknown";

  const createdAtFormatted = incoming.createdAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(incoming.createdAt))
    : "recently";

  const openViewer = (index = 0) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <article className="w-full max-w-[740px] mx-auto bg-reddit-card dark:bg-reddit-dark_card rounded-xl p-4 border border-reddit-border dark:border-reddit-dark_divider shadow-sm">
      {/* HEADER */}
      <header className="flex items-start gap-3">
        <Link to={`/r/${community}`} className="h-10 w-10 block">
          <img
            src={(incoming.community?.icon && incoming.community.icon.trim()) || defaultProfileImg}
            className="h-full w-full rounded-full object-cover"
            alt="community icon"
            onError={(e) => { e.target.src = defaultProfileImg; }}
          />
        </Link>

        <div className="flex-1">
          <div className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
            <Link
              to={`/r/${community}`}
              className="font-semibold text-reddit-text dark:text-reddit-dark_text hover:underline"
            >
              r/{community}
            </Link>{" "}
            • Posted by{" "}
            <Link
              to={`/u/${incoming.author?.username}`}
              className="hover:underline font-semibold"
            >
              u/{incoming.author?.username ?? "user"}
            </Link>{" "}
            • {createdAtFormatted}
          </div>

          <h1 className="mt-2 text-2xl font-bold text-reddit-text dark:text-reddit-dark_text leading-7">
            {currentTitle}
          </h1>
          
          {/* LINK URL */}
          {incoming.url && (
            <a
              href={incoming.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-sm text-reddit-blue hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              🔗 {incoming.url}
            </a>
          )}
        </div>

        {/* 3-dot menu */}
        <div className="ml-2 relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="p-2 rounded-full hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover text-reddit-icon dark:text-reddit-dark_icon"
          >
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded shadow-lg z-30">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-reddit-text dark:text-reddit-dark_text hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
              >
                Share
              </button>

              {token && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-reddit-text dark:text-reddit-dark_text hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
                >
                  {saved ? "Unsave" : "Save"}
                </button>
              )}

              {user && user._id === incoming.author?._id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick();
                  }}
                  className="w-full text-left px-3 py-2 text-reddit-text dark:text-reddit-dark_text hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors flex items-center gap-2"
                >
                  <PencilIcon className="h-4 w-4" /> Edit
                </button>
              )}

              {user && (user._id === incoming.author?._id || isMod) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-600 hover:text-white transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* BODY */}
      {currentBody && (
        <div
          className="post-content mt-4 text-reddit-text_light dark:text-reddit-dark_text_light whitespace-pre-wrap leading-relaxed"
          dangerouslySetInnerHTML={{ __html: currentBody }}
        />
      )}

      {/* MEDIA */}
      {incoming.processing ? (
        <div className="mt-4 rounded-xl bg-black/40 h-[420px] animate-pulse flex items-center justify-center text-white text-lg">
          Processing video…
        </div>
      ) : videoUrl ? (
        <div className="mt-4 rounded-xl overflow-hidden bg-black/60 no-scrollbar">
          <video
            src={videoUrl}
            controls
            className="w-full max-h-[520px] object-contain bg-black"
          />
        </div>
      ) : (
        images.length > 0 && (
          <ImageCarousel images={images} onImageClick={openViewer} />
        )
      )}

      {/* ACTION BAR */}
      <div className="mt-4 flex items-center gap-3 flex-nowrap overflow-x-auto no-scrollbar text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
        <div className="flex-shrink-0">
          <VoteButtons
            postId={postId}
            initialScore={incoming.score}
            initialVote={incoming.yourVote ?? 0}
          />
        </div>

        {/* Comments Button */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-reddit-hover dark:bg-reddit-dark_hover text-sm cursor-pointer flex-shrink-0"
          onClick={() => navigate(`/post/${postId}#comments`)}
        >
          <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
          <span>Comments</span>
          <span>{incoming.commentsCount ?? 0}</span>
        </div>

        {/* Share */}
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-reddit-hover dark:bg-reddit-dark_hover hover:bg-reddit-border dark:hover:bg-reddit-dark_border text-sm cursor-pointer flex-shrink-0 transition-colors"
          onClick={handleShare}
        >
          <ShareOutline className="h-4 w-4" />
          <span>Share</span>
        </button>

        {/* AI Summarize */}
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-sm cursor-pointer flex-shrink-0 transition-all"
          onClick={() => setShowAISummary(true)}
          title="Summarize with AI"
        >
          <SparklesIcon className="h-4 w-4" />
          <span className="font-medium">Summarize</span>
        </button>
      </div>

      {viewerOpen && (
        <FullscreenImageViewer
          images={images}
          index={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-reddit-card dark:bg-reddit-dark_card p-4 sm:p-6 rounded-2xl w-full max-w-[600px] relative text-reddit-text dark:text-reddit-dark_text max-h-[90vh] overflow-y-auto">
            <button className="absolute top-3 right-3 p-1 hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover rounded-full" onClick={() => setShowEditModal(false)}>
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PencilIcon className="h-5 w-5 text-reddit-blue" />
              Edit Post
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider focus:border-reddit-blue outline-none transition-colors"
                  placeholder="Post title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Body</label>
                <RichTextEditor value={editBody} onChange={setEditBody} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                className="px-5 py-2 rounded-full bg-reddit-hover dark:bg-reddit-dark_hover hover:bg-reddit-border dark:hover:bg-reddit-dark_border transition-colors" 
                onClick={() => setShowEditModal(false)}
                disabled={editLoading}
              >
                Cancel
              </button>
              <button 
                className="px-5 py-2 rounded-full bg-reddit-blue hover:bg-reddit-blue_hover text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={onEditSave}
                disabled={editLoading || !editTitle.trim()}
              >
                {editLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI SUMMARY MODAL */}
      <AISummaryModal
        isOpen={showAISummary}
        onClose={() => setShowAISummary(false)}
        postId={incoming._id}
        postTitle={currentTitle}
      />
    </article>
  );
}
