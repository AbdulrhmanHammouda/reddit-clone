import { useState } from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";

export default function CommentReplyBox({
  onReply,
  onCancel,
  topLevel = false,
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null); // single image

  function submit() {
    if (!text.trim() && !image) return;
    onReply(text.trim(), image ? [image] : []); // ✔ send array with single image
    setText("");
    setImage(null);
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    setImage(file || null);
  }

  return (
    <div className="w-full">
      <div className="w-full border border-reddit-border dark:border-reddit-dark_divider bg-white dark:bg-reddit-dark_card rounded-3xl px-4 py-3 flex flex-col gap-3">

        {/* TEXT AREA */}
        <textarea
          className="w-full resize-none bg-transparent outline-none text-reddit-text dark:text-reddit-dark_text placeholder:text-reddit-text_secondary dark:placeholder:text-reddit-dark_text_secondary"
          rows={topLevel ? 4 : 2}
          placeholder={topLevel ? "Add a comment" : "Add your reply"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* IMAGE PREVIEW */}
        {image && (
          <div className="relative w-fit">
            <img
              src={URL.createObjectURL(image)}
              className="h-24 w-24 object-cover rounded-md border"
            />
            <button
              onClick={() => setImage(null)}
              className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* TOOLBAR */}
        <div className="flex items-center justify-between">

          {/* Upload images */}
          <label className="cursor-pointer flex items-center gap-1 text-sm text-reddit-icon dark:text-reddit-dark_icon">
            <PhotoIcon className="h-5 w-5" />
            <input
              type="file"
              name="image" 
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>

          {/* ACTIONS */}
          <div className="flex gap-2">
            {!topLevel && (
              <button
                onClick={onCancel}
                className="px-4 py-1 rounded-full bg-reddit-hover dark:bg-reddit-dark_hover text-sm"
              >
                Cancel
              </button>
            )}

            <button
              onClick={submit}
              disabled={!text.trim() && !image}
              className="px-4 py-1 rounded-full font-medium text-sm bg-reddit-blue text-white disabled:opacity-50"
            >
              {topLevel ? "Comment" : "Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
