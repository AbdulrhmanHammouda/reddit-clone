// src/components/ChatSidebar.jsx
import React, { useEffect, useRef, useState } from "react";
import { XMarkIcon, ArrowLeftIcon, PlusIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import ChatThreadItem from "./ChatThreadItem";

/**
 * ChatSidebar
 * - open (bool)  : whether drawer is visible
 * - onClose (fn) : called to close
 *
 * Integration: render <ChatSidebar open={chatOpen} onClose={() => setChatOpen(false)} />
 * inside MainLayout (near bottom) so it's in top-level stacking context.
 */
const MOCK_THREADS = [
  { id: "1", name: "Ahmed", preview: "Hey — you saw that post?", time: "2h", unread: 2, avatar: "https://www.redditstatic.com/avatars/avatar_default_06_FF4500.png" },
  { id: "2", name: "Omar", preview: "Let's sync tomorrow.", time: "1d", unread: 0, avatar: "https://www.redditstatic.com/avatars/avatar_default_04_FF8717.png" },
  { id: "3", name: "Fatma", preview: "Hahaha that meme", time: "3d", unread: 1, avatar: "https://www.redditstatic.com/avatars/avatar_default_02_24A0ED.png" },
  { id: "4", name: "Ziad", preview: "Sent you the doc.", time: "4d", unread: 0, avatar: "https://www.redditstatic.com/avatars/avatar_default_03_46A508.png" },
];

export default function ChatSidebar({ open = false, onClose = () => {} }) {
  const [panel, setPanel] = useState("threads"); // "threads" | "new" | "chat"
  const [selectedThread, setSelectedThread] = useState(null);
  const [users, setUsers] = useState("");
  const containerRef = useRef(null);

  // lock body scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = prev);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // click outside to close (overlay handles most, but double-check)
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onClose]);

  // no render if closed (keeps DOM tidy)
  if (!open) return null;

  return (
    <>
      {/* overlay */}
      <div
        className="fixed inset-0 z-[1200] bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* drawer container: anchored between top and bottom to avoid vertical translate issues */}
      <div
        ref={containerRef}
        className="fixed right-6 top-34 bottom-8 z-[1300] w-[680px] h-[500px] max-w-[95vw] rounded-2xl bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider shadow-2xl overflow-hidden transform transition-transform duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Chats"
        style={{ display: "flex", flexDirection: "column" }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-reddit-border dark:border-reddit-dark_divider">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">r</div>
            <div>
              <div className="text-lg font-semibold text-reddit-text dark:text-reddit-dark_text">Chats</div>
              <div className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary">Messages</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPanel("new"); setSelectedThread(null); }}
              className="p-2 rounded-md hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
              title="Start new chat"
            >
              <PlusIcon className="h-5 w-5 text-reddit-text dark:text-reddit-dark_text" />
            </button>

            <button className="p-2 rounded-md hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover" title="Settings">
              <Cog6ToothIcon className="h-5 w-5 text-reddit-text dark:text-reddit-dark_text" />
            </button>

            <button onClick={onClose} className="p-2 rounded-md hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover" aria-label="Close chats">
              <XMarkIcon className="h-5 w-5 text-reddit-text dark:text-reddit-dark_text" />
            </button>
          </div>
        </div>

        {/* body -- two columns */}
        <div className="flex h-full" style={{ minHeight: 0 }}>
          {/* threads column */}
          <aside className="w-[300px] border-r border-reddit-border dark:border-reddit-dark_divider overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-reddit-text dark:text-reddit-dark_text">Threads</div>
                <button
                  onClick={() => { setPanel("new"); setSelectedThread(null); }}
                  className="text-sm px-2 py-1 rounded-md bg-reddit-blue text-white"
                >
                  New
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {MOCK_THREADS.map((t) => (
                  <ChatThreadItem
                    key={t.id}
                    avatar={t.avatar}
                    name={t.name}
                    preview={t.preview}
                    time={t.time}
                    unread={t.unread}
                    onClick={() => { setSelectedThread(t); setPanel("chat"); }}
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* panel column */}
          <section className="flex-1 p-4 overflow-y-auto" style={{ minHeight: 0 }}>
            {panel === "threads" && (
              <div className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                Select a thread or start a new chat.
              </div>
            )}

            {panel === "new" && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setPanel("threads")}
                    className="p-2 rounded-md hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
                    aria-label="Back to threads"
                  >
                    <ArrowLeftIcon className="h-5 w-5 text-reddit-text dark:text-reddit-dark_text" />
                  </button>
                  <h3 className="text-lg font-semibold text-reddit-text dark:text-reddit-dark_text">New Chat</h3>
                </div>

                <label className="block text-sm mb-2 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                  Type username(s)
                </label>

                <input
                  type="text"
                  value={users}
                  onChange={(e) => setUsers(e.target.value)}
                  placeholder="Type username(s) ..."
                  className="w-full px-4 py-3 rounded-md bg-[#1f1f1f] dark:bg-[#0f0f0f] border border-reddit-border dark:border-reddit-dark_divider text-reddit-text focus:outline-none"
                />

                <p className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary mt-2">
                  Search for people by username to chat with them.
                </p>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => { alert(`Starting chat with: ${users || "(none)"}`); setUsers(""); setPanel("threads"); }}
                    className="px-4 py-2 rounded-full bg-reddit-blue text-white"
                  >
                    Start Chat
                  </button>

                  <button onClick={() => { setUsers(""); setPanel("threads"); }} className="px-3 py-2 rounded-full border border-reddit-border text-reddit-text_secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {panel === "chat" && selectedThread && (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <img src={selectedThread.avatar} alt="" className="h-10 w-10 rounded-full" />
                  <div>
                    <div className="font-semibold text-reddit-text dark:text-reddit-dark_text">{selectedThread.name}</div>
                    <div className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary">Online</div>
                  </div>
                </div>

                {/* messages area */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                  <div className="max-w-[70%] bg-[#111] px-3 py-2 rounded-md text-sm text-reddit-text">
                    Hey — this is a mock message from {selectedThread.name}.
                  </div>
                  <div className="self-end max-w-[70%] bg-reddit-blue px-3 py-2 rounded-md text-sm text-white">
                    Reply mock
                  </div>
                </div>

                {/* composer */}
                <div className="border-t border-reddit-border dark:border-reddit-dark_divider pt-3">
                  <div className="flex gap-2">
                    <input className="flex-1 px-3 py-2 rounded-md bg-[#1b1b1b] dark:bg-[#0b0b0b] border border-reddit-border dark:border-reddit-dark_divider text-reddit-text focus:outline-none" placeholder="Message..." />
                    <button className="px-3 py-2 rounded-full bg-reddit-blue text-white">Send</button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
