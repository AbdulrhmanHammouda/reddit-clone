// src/pages/PostPage.jsx  OR  src/components/PostCardFull.jsx
// (but make sure you only have ONE default PostCardFull in the project)

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import VoteButtons from "../components/VoteButtons";
import {
  ChatBubbleBottomCenterTextIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import useAuth from "../hooks/useAuth";

export default function PostCardFull({ postId: propPostId }) {
  const params = useParams();          // from /post/:id
  const navigate = useNavigate();
  const { token, user } = useAuth();

  // use prop if given, otherwise URL param
  const id = propPostId || params.id;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isMod, setIsMod] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // State for current image index in slider

  useEffect(() => {
    // guard: no API call with undefined id
    if (!id) {
      setError("No post id provided");
      setLoading(false);
      return;
    }

    async function fetchPost() {
      try {
        const response = await api.get(`/posts/${id}`);
        const data = response.data.data;

        setPost(data);
        setSaved(data.saved || false);
        setIsMember(data.community?.isMember || false);
        setIsMod(data.community?.isMod || false);
        setCurrentImageIndex(0); // Reset slider position for new post
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Error fetching post");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id]);

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
      // go back to previous page (e.g. profile or community)
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
        .share({ title: post?.title || "Post", url })
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

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!post) return null;

  const totalImages = post.images?.length || 0;

  const goToNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % totalImages);
  };

  const goToPrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + totalImages) % totalImages);
  };

  const postId = post._id;
  const community = post.community?.name ?? "unknown";

  const createdAtFormatted = post.createdAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(post.createdAt))
    : "recently";

  return (
    <article className="w-full max-w-[740px] mx-auto bg-reddit-card dark:bg-reddit-dark_card rounded-xl p-4 border border-reddit-border dark:border-reddit-dark_divider shadow-sm">
      {/* HEADER */}
      <header className="flex items-start gap-3">
        <Link to={`/r/${community}`} className="h-10 w-10 block">
          <img
            src={post.community?.icon}
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
              to={`/u/${post.author?.username}`}
              className="hover:underline font-semibold"
            >
              u/{post.author?.username ?? "user"}
            </Link>{" "}
            • {createdAtFormatted}
          </div>

          <h1 className="mt-2 text-2xl font-bold text-reddit-text dark:text-reddit-dark_text leading-7">
            {post.title}
          </h1>
        </div>

        {/* 3-dot menu */}
        <div className="ml-2 relative">
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
                className="w-full text-left px-3 py-2 hover:bg-reddit-hover"
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
                  className="w-full text-left px-3 py-2 hover:bg-reddit-hover"
                >
                  {saved ? "Unsave" : "Save"}
                </button>
              )}

              {user && (user._id === post.author?._id || isMod) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-red-600 hover:text-white"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* BODY */}
      {post.body && (
        <div
          className="mt-4 text-reddit-text_light dark:text-reddit-dark_text_light whitespace-pre-wrap leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      )}

      {/* IMAGE/VIDEO SLIDER */}
      {post.images?.length > 0 && (
        <div className="mt-4 relative w-full h-auto max-h-[480px] overflow-hidden rounded-md">
          <img
            src={post.images[currentImageIndex]}
            alt="post media"
            className="w-full h-full object-contain"
          />

          {totalImages > 1 && (
            <>
              {/* Navigation Buttons */}
              <button
                onClick={goToPrevImage}
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full focus:outline-none"
              >
                &#10094;
              </button>
              <button
                onClick={goToNextImage}
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full focus:outline-none"
              >
                &#10095;
              </button>

              {/* Image Indicators */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {post.images.map((_, index) => (
                  <span
                    key={index}
                    className={`block w-2 h-2 rounded-full ${
                      index === currentImageIndex ? "bg-white" : "bg-gray-400"
                    }`}
                  ></span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ACTION BAR */}
      <div className="mt-4 flex items-center gap-4">
        <VoteButtons
          postId={postId}
          initialScore={post.score}
          initialVote={post.yourVote ?? 0}
        />

        {/* Comments Button */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-reddit-hover dark:bg-reddit-dark_hover text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary cursor-pointer"
          onClick={() => navigate(`/post/${postId}#comments`)}
        >
          <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
          <span>{post.commentsCount ?? 0}</span>
        </div>
      </div>
    </article>
  );
}
