import { useState } from "react";
import { ArrowUpIcon, ArrowDownIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
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
      <div className="bg-reddit-card border border-reddit-border rounded-lg p-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-reddit-hover flex items-center justify-center text-reddit-text font-semibold">{comment.author?.[0]?.toUpperCase() || 'U'}</div>

          <div className="flex-1">
            <div className="text-sm">
              <span className="font-semibold text-reddit-text mr-2">{comment.author}</span>
              <span className="text-reddit-text_secondary text-xs">{comment.time}</span>
            </div>

            <div className="mt-2 text-reddit-text_light">{comment.text}</div>

            <div className="mt-3 flex items-center gap-3 text-sm text-reddit-text_secondary">
              <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-reddit-hover">
                <ArrowUpIcon className="h-4 w-4 text-reddit-icon" />
              </button>
              <span className="text-reddit-text_secondary">{comment.score}</span>
              <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-reddit-hover" onClick={() => setShowReply((s) => !s)}>
                Reply
              </button>
              <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-reddit-hover">
                <EllipsisHorizontalIcon className="h-4 w-4 text-reddit-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reply box */}
      {showReply && (
        <div className="mt-2">
          <CommentReplyBox
            onReply={handleReply}
            onCancel={() => setShowReply(false)}
          />
        </div>
      )}

      {/* Nested replies */}
      {replies && replies.length > 0 && (
        <div className="ml-6 pl-4 border-l border-reddit-border mt-3 flex flex-col gap-3">
          {replies.map((r) => (
            <Comment key={r.id} comment={r} />
          ))}
        </div>
      )}
    </div>
  );
}
