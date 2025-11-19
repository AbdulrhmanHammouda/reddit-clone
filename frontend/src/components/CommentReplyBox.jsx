import { useState } from "react";

export default function CommentReplyBox({ onReply, onCancel }) {
  const [text, setText] = useState("");

  return (
    <div className="bg-reddit-card border border-reddit-border rounded-lg p-3 shadow-sm">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full min-h-[80px] p-2 rounded resize-vertical bg-white border border-reddit-border focus:outline-none focus:ring-1 focus:ring-reddit-upvote text-reddit-text"
        placeholder="Reply to this comment"
      />

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (text.trim()) {
              onReply(text.trim());
              setText("");
            }
          }}
          className="px-3 py-1 bg-reddit-blue hover:bg-reddit-blue_hover text-reddit-card rounded-md text-sm"
        >
          Reply
        </button>

        <button
          type="button"
          onClick={() => {
            setText("");
            onCancel();
          }}
          className="px-3 py-1 text-sm text-reddit-text_secondary hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
