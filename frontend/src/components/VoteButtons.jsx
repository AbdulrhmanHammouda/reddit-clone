// src/components/VoteButtons.jsx
import { useState } from "react";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";

export default function VoteButtons({
  postId,
  initialScore = 0,
  initialVote = 0,
}) {
  const { token } = useAuth();

  const [count, setCount] = useState(initialScore);
  const [state, setState] = useState(
    initialVote === 1 ? "up" : initialVote === -1 ? "down" : "none"
  );

  async function sendVote(direction) {
    if (!token) {
      alert("You must login to vote");
      return;
    }

    try {
      // axios interceptor already attaches Authorization header
      const res = await api.post(`/posts/${postId}/vote`, { value:direction });

      const { score, yourVote } = res.data.data;
      setCount(score);
      setState(
        yourVote === 1 ? "up" : yourVote === -1 ? "down" : "none"
      );
    } catch (err) {
      console.error("Vote error:", err?.response?.data || err);
    }
  }

  const upvote = () => {
    if (state === "up") sendVote(0);
    else sendVote(1);
  };

  const downvote = () => {
    if (state === "down") sendVote(0);
    else sendVote(-1);
  };

  const containerClass =
    `flex items-center px-3 py-[6px] rounded-full gap-1 transition-colors duration-150 ` +
    (state === "up"
      ? "bg-reddit-upvote dark:bg-reddit-dark_upvote"
      : state === "down"
      ? "bg-reddit-downvote dark:bg-reddit-dark_downvote"
      : "bg-reddit-hover dark:bg-reddit-dark_hover");

  const iconUpClass =
    `h-4 w-4 cursor-pointer ` +
    (state === "up"
      ? "text-reddit-card"
      : "text-reddit-icon dark:text-reddit-dark_icon");

  const iconDownClass =
    `h-4 w-4 cursor-pointer ` +
    (state === "down"
      ? "text-reddit-card"
      : "text-reddit-icon dark:text-reddit-dark_icon");

  const countClass =
    state === "up" || state === "down"
      ? "text-reddit-card font-medium"
      : "text-reddit-text_secondary dark:text-reddit-dark_text_secondary font-medium";

  return (
    <div className={containerClass}>
      <svg onClick={upvote} className={iconUpClass} viewBox="0 0 24 24">
        <polygon
          points="12 5 19 19 5 19"
          fill={state === "up" ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>

      <span className={countClass}>{count}</span>

      <svg onClick={downvote} className={iconDownClass} viewBox="0 0 24 24">
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
