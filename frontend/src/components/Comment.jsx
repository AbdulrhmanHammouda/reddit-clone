import { useState } from "react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import CommentReplyBox from "./CommentReplyBox";

export default function Comment({ comment }) {
  const [showReply, setShowReply] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);

  const handleReply = (text) => {
    const newReply = {
      id: Date.now(),
      author: "you",
      time: "now",
      text,
      score: 0,
      replies: [],
    };
    setReplies((r) => [...r, newReply]);
    setShowReply(false);
  };

  return (
    <div>
      {/* MAIN COMMENT BOX */}
      <div className="
        bg-reddit-card dark:bg-reddit-dark_card
        border border-reddit-border dark:border-reddit-dark_divider
        rounded-lg p-3 shadow-sm
      ">
        <div className="flex items-start gap-3">

          {/* Avatar */}
          <div className="
            h-8 w-8 rounded-full 
            bg-reddit-hover dark:bg-reddit-dark_hover
            flex items-center justify-center
            text-reddit-text dark:text-reddit-dark_text 
            font-semibold
          ">
            {comment.author?.[0]?.toUpperCase() || "U"}
          </div>

          {/* Content */}
          <div className="flex-1">

            {/* Header row */}
            <div className="text-sm">
              <span className="font-semibold text-reddit-text dark:text-reddit-dark_text mr-2">
                {comment.author}
              </span>
              <span className="text-reddit-text_secondary dark:text-reddit-dark_text_secondary text-xs">
                {comment.time}
              </span>
            </div>

            {/* Text */}
            <div className="mt-2 text-reddit-text_light dark:text-reddit-dark_text_light">
              {comment.text}
            </div>

            {/* Action bar */}
            <div className="
              mt-3 flex items-center gap-3 text-sm 
              text-reddit-text_secondary dark:text-reddit-dark_text_secondary
            ">
              {/* upvote */}
              <button className="
                flex items-center gap-1 px-2 py-1 rounded
                hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover
              ">
                <ArrowUpIcon className="h-4 w-4 text-reddit-icon dark:text-reddit-dark_icon" />
              </button>

              <span className="text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                {comment.score}
              </span>

              {/* reply button */}
              <button
                onClick={() => setShowReply((s) => !s)}
                className="
                  flex items-center gap-1 px-2 py-1 rounded
                  hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover
                "
              >
                Reply
              </button>

              {/* options */}
              <button className="
                flex items-center gap-1 px-2 py-1 rounded
                hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover
              ">
                <EllipsisHorizontalIcon className="h-4 w-4 text-reddit-icon dark:text-reddit-dark_icon" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reply Box */}
      {showReply && (
        <div className="mt-2">
          <CommentReplyBox
            onReply={handleReply}
            onCancel={() => setShowReply(false)}
          />
        </div>
      )}

      {/* Nested replies */}
      {replies?.length > 0 && (
        <div className="
          ml-6 pl-4 mt-3 flex flex-col gap-3
          border-l border-reddit-border dark:border-reddit-dark_divider
        ">
          {replies.map((r) => (
            <Comment key={r.id} comment={r} />
          ))}
        </div>
      )}
    </div>
  );
}
