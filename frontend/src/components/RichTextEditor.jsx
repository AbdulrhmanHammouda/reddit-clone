import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border rounded-md p-2 bg-reddit-card dark:bg-reddit-dark_card">
      {/* Toolbar */}
      <div className="flex gap-1 border-b pb-1 mb-2 text-sm">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className="px-2">B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className="px-2 italic">I</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className="px-2">• List</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className="px-2">1. List</button>
        <button onClick={() => editor.chain().focus().setHardBreak().run()} className="px-2">↵</button>
      </div>

      {/* Editable content */}
      <EditorContent editor={editor} className="min-h-[150px] focus:outline-none px-2" />
    </div>
  );
}
