// src/components/RichTextEditor.jsx
import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[160px] w-full px-3 py-2 rounded-md bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider outline-none text-sm",
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      if (onChange) onChange(html);
    },
  });

  // If value changes from outside, sync it into editor
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border border-reddit-border dark:border-reddit-dark_divider rounded-md bg-reddit-card dark:bg-reddit-dark_card">
      {/* toolbar */}
     {/* toolbar */}
<div className="flex items-center gap-1 px-2 py-1 border-b border-reddit-border dark:border-reddit-dark_divider text-xs">

  {/* Bold */}
  <button
    type="button"
    onClick={() => {
      editor.chain().focus().toggleBold().run();
    }}
    className={`px-2 py-1 rounded font-semibold ${
      editor.isActive("bold")
        ? "bg-reddit-blue text-white"
        : "bg-reddit-card dark:bg-reddit-dark_card"
    }`}
    title="Bold (Ctrl+B)"
  >
    B
  </button>

  {/* Italic */}
  <button
    type="button"
    onClick={() => {
      editor.chain().focus().toggleItalic().run();
    }}
    className={`px-2 py-1 rounded italic ${
      editor.isActive("italic")
        ? "bg-reddit-blue text-white"
        : "bg-reddit-card dark:bg-reddit-dark_card"
    }`}
    title="Italic (Ctrl+I)"
  >
    I
  </button>

  {/* Bullet List */}
  <button
    type="button"
    onClick={() => {
      editor.chain().focus().toggleBulletList().run();
    }}
    className={`px-2 py-1 rounded ${
      editor.isActive("bulletList")
        ? "bg-reddit-blue text-white"
        : "bg-reddit-card dark:bg-reddit-dark_card"
    }`}
    title="Bullet List"
  >
    •
  </button>

  {/* Numbered List */}
  <button
    type="button"
    onClick={() => {
      editor.chain().focus().toggleOrderedList().run();
    }}
    className={`px-2 py-1 rounded ${
      editor.isActive("orderedList")
        ? "bg-reddit-blue text-white"
        : "bg-reddit-card dark:bg-reddit-dark_card"
    }`}
    title="Numbered List"
  >
    1.
  </button>

  {/* Code */}
  <button
    type="button"
    onClick={() => {
      editor.chain().focus().toggleCode().run();
    }}
    className={`px-2 py-1 rounded font-mono ${
      editor.isActive("code")
        ? "bg-reddit-blue text-white"
        : "bg-reddit-card dark:bg-reddit-dark_card"
    }`}
    title="Inline Code"
  >
    &lt;/&gt;
  </button>
</div>


      {/* editor area */}
      <div className="px-0 py-0">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
