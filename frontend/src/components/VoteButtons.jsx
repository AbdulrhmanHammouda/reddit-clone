// src/components/VoteButtons.jsx
import { useState, useEffect } from "react";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";

export default function VoteButtons({
  postId,
  commentId,
  initialScore = 0,
  initialVote = 0,
}) {
  const { token } = useAuth();

  const [count, setCount] = useState(initialScore);
  const [state, setState] = useState(
    initialVote === 1 ? "up" : initialVote === -1 ? "down" : "none"
  );

  // ✅ Sync after backend fetch
  useEffect(() => {
    setCount(initialScore);
    setState(
      initialVote === 1 ? "up" : initialVote === -1 ? "down" : "none"
    );
  }, [initialScore, initialVote]);

  const isComment = !!commentId;
  const id = commentId || postId;

  async function sendVote(value) {
    if (!token) {
      alert("Login before voting!");
      return;
    }

    try {
      const url = isComment
        ? `/comments/${id}/vote`
        : `/posts/${id}/vote`;

      const res = await api.post(url, { value });
      const { score, yourVote } = res.data.data;

      setCount(score);
      setState(
        yourVote === 1 ? "up" : yourVote === -1 ? "down" : "none"
      );
    } catch (err) {
      console.error("Vote error:", err?.response?.data || err);
    }
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-[6px] rounded-full transition-colors duration-150 ${
        state === "up"
          ? "bg-reddit-upvote dark:bg-reddit-dark_upvote"
          : state === "down"
          ? "bg-reddit-downvote dark:bg-reddit-dark_downvote"
          : "bg-reddit-hover dark:bg-reddit-dark_hover"
      }`}
    >
      <svg
        onClick={() => sendVote(state === "up" ? 0 : 1)}
        className={`h-4 w-4 cursor-pointer ${
          state === "up"
            ? "text-reddit-card"
            : "text-reddit-icon dark:text-reddit-dark_icon"
        }`}
        viewBox="0 0 24 24"
      >
        <polygon
          points="12 5 19 19 5 19"
          fill={state === "up" ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>

      <span
        className={`font-medium ${
          state === "up" || state === "down"
            ? "text-reddit-card"
            : "text-reddit-text_secondary dark:text-reddit-dark_text_secondary"
        }`}
      >
        {count}
      </span>

      <svg
        onClick={() => sendVote(state === "down" ? 0 : -1)}
        className={`h-4 w-4 cursor-pointer ${
          state === "down"
            ? "text-reddit-card"
            : "text-reddit-icon dark:text-reddit-dark_icon"
        }`}
        viewBox="0 0 24 24"
      >
        <polygon
          points="5 5 19 5 12 19"
          fill={state === "down" ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    </div>
  );
}
