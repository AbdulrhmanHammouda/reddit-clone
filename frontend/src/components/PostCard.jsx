import {
  ChatBubbleBottomCenterTextIcon,
  EllipsisHorizontalIcon,
  ShareIcon as ShareOutline,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import VoteButtons from "./VoteButtons";
import React, { useState, useRef, useEffect } from "react";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import ImageCarousel from "./ImageCarousel";
import FullscreenImageViewer from "./FullscreenImageViewer";

export default function PostCard(props) {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const incoming = props.post ?? props;
  const id = incoming._id ?? incoming.id ?? null;
  const title = incoming.title ?? "";
  const body = incoming.body ?? "";
  const score = Number(incoming.score ?? incoming.votes ?? incoming.upvotes ?? 0);
  const commentsCount =
    incoming.commentsCount ?? incoming.commentCount ?? incoming.comments ?? 0;

  const communityObj =
    typeof incoming.community === "string"
      ? { name: incoming.community }
      : incoming.community ?? {};
  const community = communityObj.name ?? communityObj.title ?? "unknown";

  const communityAvatar =
    communityObj.avatar ??
    communityObj.icon ??
    "https://www.redditstatic.com/avatars/avatar_default_02_46D160.png";

  const authorObj =
    typeof incoming.author === "string"
      ? { username: incoming.author }
      : incoming.author ?? {};
  const author = authorObj.username ?? authorObj.name ?? "user";

  const createdAgo = incoming.createdAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(incoming.createdAt))
    : "recently";

  const videoUrl = incoming.videoUrl ?? null;
  const images =
    incoming.imageUrl && Array.isArray(incoming.imageUrl)
      ? incoming.imageUrl
      : incoming.images || [];

  if (!incoming || typeof incoming !== "object") return null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(incoming.saved || false);
  const [isMember, setIsMember] = useState(incoming.community?.isMember || false);
  const [isMod, setIsMod] = useState(incoming.community?.isMod || false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const menuRef = useRef(null);

  useEffect(() => {
    function onDocDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [menuOpen]);

  function handleShare() {
    const url = `${window.location.origin}/post/${id}`;
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  }

  async function toggleSave() {
    if (!token) return alert("Login to save posts");
    try {
      if (!saved) {
        await api.post(`/posts/${id}/save`);
        setSaved(true);
        props.onToggleSave?.(id, true); // 🔥 notify parent state
      } else {
        await api.delete(`/posts/${id}/save`);
        setSaved(false);
        props.onToggleSave?.(id, false); // 🔥 notify parent state
      }
    } catch (err) {
      console.error(err);
    }
  }

  const openViewer = (index = 0) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  function onDeleteClick() {
    setShowDeleteModal(true);
    setMenuOpen(false);
  }

  async function onDeleteConfirm() {
    if (!token) return;
    await api.delete(`/posts/${id}`);
    navigate(0);
  }

  async function handleJoin(e) {
    e.stopPropagation();
    if (!token) return navigate("/login");
    await api.post(`/communities/${community}/join`);
    setIsMember(true);
  }

  return (
    <>
      <div className="w-full max-w-[740px] bg-reddit-card dark:bg-reddit-dark_card rounded-xl p-4 border border-reddit-border dark:border-reddit-dark_divider shadow-sm transition-colors">

        {/* HEADER */}
        <div className="flex items-center justify-between text-[13px] text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
          <div className="flex items-center gap-2">
            <Link to={`/r/${community}`} className="h-6 w-6">
              <img src={communityAvatar} className="h-full w-full rounded-full" />
            </Link>

            <Link to={`/r/${community}`} className="font-semibold text-reddit-text dark:text-reddit-dark_text hover:underline">
              r/{community}
            </Link>

            <span>•</span>
            <Link to={`/u/${author}`} className="truncate max-w-[120px] hover:underline">
              u/{author}
            </Link>

            <span>•</span>
            <span>{createdAgo}</span>
          </div>

          <div className="flex items-center gap-2">
            {!isMember && (
              <button
                className="bg-reddit-blue hover:bg-reddit-blue_hover text-white text-xs font-semibold px-3 py-1 rounded-full"
                onClick={handleJoin}
              >
                Join
              </button>
            )}

            <div className="relative" ref={menuRef}>
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

                  {(user && (user._id === incoming.author?._id || isMod)) && (
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
        </div>

        {/* TITLE */}
        <h2
          className="mt-2 text-[18px] font-semibold text-reddit-text dark:text-reddit-dark_text leading-6 cursor-pointer hover:underline"
          onClick={() => navigate(`/post/${id}`)}
        >
          {title}
        </h2>

        {/* BODY */}
        {body && (
          <div
            className="mt-3 text-[15px] text-reddit-text_light dark:text-reddit-dark_text_light whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}

        {/* Media */}
        {videoUrl ? (
          <div className="mt-3 rounded-xl overflow-hidden bg-black/60">
            <video
              src={videoUrl}
              controls
              className="w-full max-h-[500px] object-contain bg-black"
            />
          </div>
        ) : (
          images.length > 0 && (
            <ImageCarousel images={images} onImageClick={openViewer} />
          )
        )}

        {/* ACTION BAR */}
        <div className="flex items-center gap-4 mt-3 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">

          <VoteButtons postId={id} initialScore={score} initialVote={incoming.yourVote ?? 0} />

          {/* COMMENTS */}
          <button
            className="flex items-center gap-1 px-3 py-[6px] rounded-full hover:bg-[#e8e9eb] dark:hover:bg-[#2c2d2f]"
            onClick={() => navigate(`/post/${id}`)}
          >
            <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
            <span>{commentsCount}</span>
          </button>

          {/* SHARE */}
          <button
            className="flex items-center gap-1 px-3 py-[6px] rounded-full hover:bg-[#e8e9eb] dark:hover:bg-[#2c2d2f]"
            onClick={handleShare}
          >
            <ShareOutline className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {viewerOpen && (
        <FullscreenImageViewer
          images={images}
          index={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0b1113] p-6 rounded-2xl w-[430px] relative text-white">
            <button className="absolute top-3 right-3 p-1" onClick={() => setShowDeleteModal(false)}>
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold mb-2">Delete post?</h3>
            <p className="text-sm opacity-60 mb-6">
              Once you delete this post, it can’t be restored.
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
    </>
  );
}
