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
} from "@heroicons/react/24/outline";
import useAuth from "../hooks/useAuth";
import ImageCarousel from "./ImageCarousel";
import FullscreenImageViewer from "./FullscreenImageViewer";

export default function PostCardFull({ post: incomingProp, postId: propPostId }) {
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
            src={incoming.community?.icon}
            className="h-full w-full rounded-full object-cover"
            alt="community icon"
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
            {incoming.title}
          </h1>
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
      {incoming.body && (
        <div
          className="mt-4 text-reddit-text_light dark:text-reddit-dark_text_light whitespace-pre-wrap leading-relaxed"
          dangerouslySetInnerHTML={{ __html: incoming.body }}
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
      </div>

      {viewerOpen && (
        <FullscreenImageViewer
          images={images}
          index={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </article>
  );
}
