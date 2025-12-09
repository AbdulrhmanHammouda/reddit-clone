import { useState } from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";

export default function CommentReplyBox({
  onReply,
  onCancel,
  topLevel = false,
}) {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]); // multiple images

  function submit() {
    if (!text.trim() && images.length === 0) return;
    onReply(text.trim(), images); // ✔ send array of images
    setText("");
    setImages([]);
  }

  function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]); // Append NOT replace
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
        {images.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {images.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  className="h-24 w-24 object-cover rounded-md border"
                />
                <button
                  onClick={() =>
                    setImages(images.filter((_, i) => i !== index))
                  }
                  className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TOOLBAR */}
        <div className="flex items-center justify-between">

          {/* Upload images */}
          <label className="cursor-pointer flex items-center gap-1 text-sm text-reddit-icon dark:text-reddit-dark_icon">
            <PhotoIcon className="h-5 w-5" />
            <input
              type="file"
              name="images" 
              className="hidden"
              accept="image/*"
              multiple
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
              disabled={!text.trim() && images.length === 0}
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
