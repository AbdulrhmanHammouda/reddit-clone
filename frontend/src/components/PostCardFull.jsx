// src/pages/PostPage.jsx or PostCardFull.jsx (whichever file you are using)

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import VoteButtons from "../components/VoteButtons";
import {
  ChatBubbleBottomCenterTextIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import useAuth from "../hooks/useAuth";


export default function PostCardFull() {
  const { id } = useParams(); // ✔ Correct param from route /post/:id
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isMod, setIsMod] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await api.get(`/posts/${id}`); // ✔ Correct request path
        setPost(response.data.data);
        setSaved(response.data.data.saved || false);
        setIsMember(response.data.data.community?.isMember || false);
        setIsMod(response.data.data.community?.isMod || false);
      } catch (err) {
        setError("Error fetching post");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchPost();
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
    } catch (err) { console.error(err); }
  }

  async function onDelete() {
    if (!token) return;
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${id}`);
      // after delete, navigate away or update UI
      navigate(-1); // go back
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/post/${id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url }).catch(() => { });
    } else {
      navigator.clipboard?.writeText(url).then(() => {
        alert("Link copied to clipboard");
      }).catch(() => {
        prompt("Copy link", url);
      });
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!post) return null;

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

        <div className="ml-2 relative">
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }} className="p-2 rounded-full hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover text-reddit-icon dark:text-reddit-dark_icon">
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded shadow-lg z-30">
              <button onClick={(e) => { e.stopPropagation(); handleShare(); setMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-reddit-hover">Share</button>

              {token && (
                <button onClick={(e) => { e.stopPropagation(); toggleSave(); setMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-reddit-hover">
                  {saved ? "Unsave" : "Save"}
                </button>
              )}

              <button onClick={(e) => { e.stopPropagation(); console.log('Promote'); setMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-reddit-hover">Promote Post</button>

              <button onClick={(e) => { e.stopPropagation(); console.log('Hide'); setMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-reddit-hover">Hide</button>

              {(user && (user._id === post.author?._id || isMod)) && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-red-600 hover:text-white">Delete</button>
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

      {/* IMAGE/VIDEO */}
      {post.imageUrl && (
        <div className="mt-4 rounded-lg overflow-hidden">
          <img
            src={post.imageUrl}
            alt="post media"
            className="w-full max-h-[480px] object-cover"
          />
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
