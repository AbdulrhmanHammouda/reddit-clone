import { useState } from "react";

// Reddit-style arrow components (outline when inactive, filled when active)
function UpArrow({ className, onClick, filled = false }) {
  return (
    <svg
      onClick={onClick}
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      {filled ? (
        <polygon points="12 4 20 18 4 18" fill="currentColor" />
      ) : (
        <polygon points="12 5 19 19 5 19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function DownArrow({ className, onClick, filled = false }) {
  return (
    <svg
      onClick={onClick}
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      {filled ? (
        <polygon points="4 6 20 6 12 20" fill="currentColor" />
      ) : (
        <polygon points="5 5 19 5 12 19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default function VoteButtons({ initial }) {
  const [count, setCount] = useState(initial);
  const [state, setState] = useState("none"); // "none" | "up" | "down"

  const upvote = () => {
    if (state === "up") {
      setCount(count - 1);
      setState("none");
    } else if (state === "down") {
      setCount(count + 2);
      setState("up");
    } else {
      setCount(count + 1);
      setState("up");
    }
  };

  const downvote = () => {
    if (state === "down") {
      setCount(count + 1);
      setState("none");
    } else if (state === "up") {
      setCount(count - 2);
      setState("down");
    } else {
      setCount(count - 1);
      setState("down");
    }
  };

  const containerClass = `flex items-center px-3 py-[6px] rounded-full gap-1 ` +
    (state === "up"
      ? "bg-reddit-upvote"
      : state === "down"
      ? "bg-reddit-downvote"
      : "bg-reddit-hover dark:bg-reddit-hover_dark");

  const iconUpClass = `h-4 w-4 cursor-pointer ` + (state === "up" ? "text-reddit-card" : "text-reddit-icon dark:text-reddit-icon");
  const iconDownClass = `h-4 w-4 cursor-pointer ` + (state === "down" ? "text-reddit-card" : "text-reddit-icon dark:text-reddit-icon");
  const countClass = state === "up" || state === "down" ? "text-reddit-card font-medium" : "text-reddit-text_secondary dark:text-reddit-text_secondary font-medium";

  return (
    <div className={containerClass}>
      <UpArrow onClick={upvote} filled={state === "up"} className={iconUpClass} />

      <span className={countClass}>{count}</span>

      <DownArrow onClick={downvote} filled={state === "down"} className={iconDownClass} />
    </div>
  );
}
