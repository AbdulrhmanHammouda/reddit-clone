import {
  ChatBubbleBottomCenterTextIcon,
  EllipsisHorizontalIcon,
  ShareIcon as ShareOutline,
  XMarkIcon,
  PencilIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import VoteButtons from "./VoteButtons";
import React, { useState, useRef, useEffect, memo } from "react";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import ImageCarousel from "./ImageCarousel";
import FullscreenImageViewer from "./FullscreenImageViewer";
import defaultProfileImg from "../assets/default_profile.jpeg";
import { toast } from "react-hot-toast";
import RichTextEditor from "./RichTextEditor";
import AISummaryModal from "./AISummaryModal";

const PostCard = memo(function PostCard(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { communityName, name: routeCommunityName } = useParams();
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
  const [isMember, setIsMember] = useState(Boolean(incoming.community?.isMember));
  const [isMod, setIsMod] = useState(incoming.community?.isMod || false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [scoreState, setScoreState] = useState(score);
  const [voteState, setVoteState] = useState(incoming.yourVote ?? 0);
  const [joinLoading, setJoinLoading] = useState(false);
  
  // Edit post state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editBody, setEditBody] = useState(body);
  const [editLoading, setEditLoading] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentBody, setCurrentBody] = useState(body);

  // AI Summary state
  const [showAISummary, setShowAISummary] = useState(false);

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

  async function toggleHide() {
    if (!token) return alert("Login to hide posts");
    try {
      if (!hidden) {
        await api.post(`/posts/${id}/hide`);
        setHidden(true);
        props.onHide?.(id);
      } else {
        await api.delete(`/posts/${id}/hide`);
        setHidden(false);
      }
    } catch (err) {
      console.error("Hide error:", err);
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
    try {
      await api.delete(`/posts/${id}`);
      props.onDelete?.(id);
      setShowDeleteModal(false);
      toast.success("Post deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  }

  async function handleJoin(e) {
    e.stopPropagation();
    if (!token) return;
    try {
      setJoinLoading(true);
      await api.post(`/communities/${community}/join`);
      setIsMember(true); // optimistic
      setMenuOpen(false);
      toast.success(`Joined r/${community}`);
    } catch (err) {
      console.error("Join error", err);
      toast.error("Failed to join");
    } finally {
      setJoinLoading(false);
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
        props.onEdit?.(id, { title: editTitle.trim(), body: editBody });
      }
    } catch (err) {
      console.error("Edit error:", err);
      toast.error(err.response?.data?.error || "Failed to update post");
    } finally {
      setEditLoading(false);
    }
  }

  if (hidden) return null;

  return (
    <>
      <div className="w-full max-w-[740px] bg-reddit-card dark:bg-reddit-dark_card rounded-xl p-3 sm:p-4 border border-reddit-border dark:border-reddit-dark_divider shadow-sm transition-colors">

        {/* HEADER */}
        <div className="flex items-center justify-between text-[12px] sm:text-[13px] text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
          <div className="flex items-center gap-2">
            {community && (
              <>
                <Link to={`/r/${community}`} className="h-6 w-6">
                  <img src={communityAvatar || defaultProfileImg} className="h-full w-full rounded-full" />
                </Link>
                <Link
                  to={`/r/${community}`}
                  className="font-semibold text-reddit-text dark:text-reddit-dark_text hover:underline"
                >
                  r/{community}
                </Link>
                <span>•</span>
              </>
            )}
            <Link to={`/u/${author}`} className="truncate max-w-[120px] hover:underline">
              u/{author}
            </Link>
            <span>•</span>
            <span>{createdAgo}</span>
          </div>

          <div className="flex items-center gap-2">
            {(() => {
              const isCommunityPage = location.pathname.startsWith("/r/");
              const isUserProfilePage = location.pathname.startsWith("/u/");
              return (
                token &&
                community &&
                !isMember &&
                !isCommunityPage &&
                !isUserProfilePage && (
                  <button
                    className="bg-reddit-blue hover:bg-reddit-blue_hover text-white text-xs font-semibold px-3 py-1 rounded-full"
                    onClick={handleJoin}
                    disabled={joinLoading}
                  >
                    {joinLoading ? "Joining..." : "Join"}
                  </button>
                )
              );
            })()}

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

                  {token && (
                    <button onClick={toggleHide} className="w-full text-left px-3 py-2 hover:bg-[#e8e9eb] dark:hover:bg-[#2c2d2f]">
                      {hidden ? "Unhide" : "Hide"}
                    </button>
                  )}

                  {user && user._id === incoming.author?._id && (
                    <button
                      onClick={onEditClick}
                      className="w-full text-left px-3 py-2 hover:bg-[#e8e9eb] dark:hover:bg-[#2c2d2f] flex items-center gap-2"
                    >
                      <PencilIcon className="h-4 w-4" /> Edit
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
          className="mt-2 text-[16px] sm:text-[18px] font-semibold text-reddit-text dark:text-reddit-dark_text leading-tight sm:leading-6 cursor-pointer hover:underline"
          onClick={() => navigate(`/post/${id}`)}
        >
          {currentTitle}
        </h2>

        {/* BODY */}
        {currentBody && (
          <div
            className="mt-3 text-[15px] text-reddit-text_light dark:text-reddit-dark_text_light whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: currentBody }}
          />
        )}

        {/* Media */}
        {incoming.processing ? (
          <div className="mt-3 rounded-xl bg-black/40 h-[320px] flex items-center justify-center text-white text-lg font-semibold animate-pulse">
            Processing video…
          </div>
        ) : videoUrl ? (
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
        <div className="flex items-center gap-2 sm:gap-3 mt-3 text-reddit-text_secondary dark:text-reddit-dark_text_secondary flex-nowrap overflow-x-auto no-scrollbar">
          <div className="flex-shrink-0">
            <VoteButtons
              postId={id}
              initialScore={scoreState}
              initialVote={voteState ?? 0}
              onVoteChange={({ score, yourVote }) => {
                setScoreState(score);
                setVoteState(yourVote);
              }}
            />
          </div>

          {/* COMMENTS */}
          <button
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-[5px] sm:py-[6px] rounded-full hover:bg-[#e8e9eb] dark:hover:bg-[#2c2d2f] flex-shrink-0"
            onClick={() => navigate(`/post/${id}`)}
          >
            <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Comments</span>
            <span className="text-xs sm:text-sm">{commentsCount}</span>
          </button>

          {/* SHARE */}
          <button
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-[5px] sm:py-[6px] rounded-full hover:bg-[#e8e9eb] dark:hover:bg-[#2c2d2f] flex-shrink-0"
            onClick={handleShare}
          >
            <ShareOutline className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Share</span>
          </button>

          {/* AI SUMMARIZE */}
          <button
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-[5px] sm:py-[6px] rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex-shrink-0 transition-all"
            onClick={() => setShowAISummary(true)}
            title="Summarize with AI"
          >
            <SparklesIcon className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-medium">Summarize</span>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b1113] p-4 sm:p-6 rounded-2xl w-full max-w-[430px] relative text-white">
            <button className="absolute top-3 right-3 p-1" onClick={() => setShowDeleteModal(false)}>
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold mb-2">Delete post?</h3>
            <p className="text-sm opacity-60 mb-6">
              Once you delete this post, it can't be restored.
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
        postId={id}
        postTitle={currentTitle}
      />
    </>
  );
});

export default PostCard;
