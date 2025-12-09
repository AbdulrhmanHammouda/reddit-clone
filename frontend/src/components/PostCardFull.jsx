// src/pages/PostPage.jsx or PostCardFull.jsx (whichever file you are using)

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import VoteButtons from "../components/VoteButtons";
import {
  ChatBubbleBottomCenterTextIcon,
  ShareIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";

export default function PostCardFull() {
  const { id } = useParams(); // ✔ Correct param from route /post/:id
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await api.get(`/posts/${id}`); // ✔ Correct request path
        setPost(response.data.data);
      } catch (err) {
        setError("Error fetching post");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchPost();
  }, [id]);

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

        <div className="ml-2">
          <button className="p-2 rounded-full hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover text-reddit-icon dark:text-reddit-dark_icon">
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>
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
          onClick={() => navigate(`/post/${postId}`)}
        >
          <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
          <span>{post.commentsCount ?? 0}</span>
        </div>

        {/* Share */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-reddit-hover dark:bg-reddit-dark_hover text-sm cursor-pointer"
          onClick={() =>
            navigator.clipboard.writeText(
              `${window.location.origin}/post/${postId}`
            )
          }
        >
          <ShareIcon className="h-4 w-4" />
          <span>Share</span>
        </div>

        {/* Save */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-reddit-hover dark:bg-reddit-dark_hover text-sm cursor-pointer">
          <BookmarkIcon className="h-4 w-4" />
          <span>Save</span>
        </div>
      </div>
    </article>
  );
}
