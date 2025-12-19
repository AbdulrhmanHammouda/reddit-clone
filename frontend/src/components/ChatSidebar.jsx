// src/components/ChatSidebar.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  XMarkIcon,
  ArrowLeftIcon,
  PlusIcon,
  ArrowsPointingOutIcon,
  PaperAirplaneIcon,
  FaceSmileIcon
} from "@heroicons/react/24/outline";
import useAuth from "../hooks/useAuth";
import api from "../api/axios";
import defaultProfileImg from "../assets/default_profile.jpeg";

export default function ChatSidebar({ open = false, onClose = () => { } }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState("threads"); // "threads" | "new" | "chat"

  // Data State
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [usersInput, setUsersInput] = useState(""); // UI state for new chat input

  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 1. Fetch Conversations List
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get("/messages");
      if (res.data.success) {
        setConversations(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  }, []);

  // 2. Poll Conversations when drawer is open
  useEffect(() => {
    if (open) {
      fetchConversations();
      const interval = setInterval(fetchConversations, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [open, fetchConversations]);

  // 3. Fetch Messages for selected conversation
  const fetchMessages = useCallback(async () => {
    if (!selectedConvo) return;
    try {
      const res = await api.get(`/messages/${selectedConvo.participant._id}`);
      if (res.data.success) {
        setMessages(res.data.data);
        // Mark read locally
        setConversations((prev) =>
          prev.map(c =>
            c.participant._id === selectedConvo.participant._id
              ? { ...c, unreadCount: 0 }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  }, [selectedConvo]);

  // 4. Poll Messages when chat is active
  useEffect(() => {
    if (open && panel === "chat" && selectedConvo) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3s
      return () => clearInterval(interval);
    }
  }, [open, panel, selectedConvo, fetchMessages]);

  // 5. Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, panel]);

  // 6. Search Users (Debounced)
  useEffect(() => {
    if (!usersInput.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(usersInput)}`);
        if (res.data.success) {
          setSearchResults(res.data.data.users || []);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [usersInput]);

  // 7. Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConvo) return;

    const content = newMessage;
    setNewMessage("");

    // Optimistic Update
    const tempMsg = {
      _id: Date.now(),
      sender: { _id: user._id, username: user.username },
      receiver: selectedConvo.participant,
      content: content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await api.post("/messages", {
        receiverId: selectedConvo.participant._id,
        content: content
      });
      fetchMessages(); // Sync real ID
      fetchConversations(); // Update list preview
    } catch (err) {
      console.error("Failed to send", err);
    }
  };

  const handleStartNewChat = (targetUser) => {
    const existing = conversations.find(c => c.participant._id === targetUser._id);
    const convoObj = existing || {
      participant: targetUser,
      lastMessage: null,
      unreadCount: 0
    };

    setSelectedConvo(convoObj);
    setPanel("chat");
    setUsersInput("");
  };

  // Close behaviors
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Overlay: Blurred glass effect */}
      <div
        className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Floating Window: Fullscreen on mobile, floating on desktop */}
      <div
        ref={containerRef}
        className="fixed inset-0 sm:inset-auto sm:right-4 md:right-8 sm:top-16 md:top-20 sm:bottom-4 md:bottom-8 z-[1300] w-full sm:w-[400px] md:w-[500px] lg:w-[750px] sm:max-w-[90vw] sm:rounded-2xl bg-white dark:bg-[#1A1A1B] sm:border border-gray-200 dark:border-[#343536] shadow-2xl flex flex-col overflow-hidden font-sans animation-slide-up"
      >
        {/* GLOBAL HEADER */}
        <div className="h-14 flex items-center justify-between px-4 sm:px-5 bg-white dark:bg-[#1A1A1B] border-b border-gray-100 dark:border-[#343536] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-red-600 flex items-center justify-center text-white font-bold shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-gray-100 tracking-tight">Chats</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-reddit-text_secondary dark:text-reddit-text_secondary">
            <button
              onClick={() => { onClose(); navigate("/chat"); }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#272729] transition-colors"
              title="Expand to Full Screen"
            >
              <ArrowsPointingOutIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setPanel("new"); setSelectedConvo(null); }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#272729] transition-colors"
              title="New Message"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#272729] transition-colors ml-1 sm:ml-2"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex flex-1 min-h-0 bg-white dark:bg-[#1A1A1B]">

          {/* LEFT SIDEBAR: THREADS - Hidden on mobile when in chat */}
          <aside className={`${panel === 'chat' && selectedConvo ? 'hidden lg:flex' : 'flex'} w-full lg:w-[280px] xl:w-[320px] flex-col lg:border-r border-gray-100 dark:border-[#343536]`}>

            {/* Search within sidebar? Optional, but fits "premium" */}
            <div className="p-3">
              <div className="bg-gray-100 dark:bg-[#272729] rounded-full px-4 py-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-reddit-text_secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  placeholder="Search chats"
                  className="bg-transparent border-none outline-none text-sm w-full text-gray-900 dark:text-gray-100 placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
              {conversations.length === 0 ? (
                <div className="text-center mt-10 text-reddit-text_secondary">
                  <p className="text-sm">No conversations yet.</p>
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive = selectedConvo?.participant?._id === c.participant._id;
                  return (
                    <div
                      key={c.participant._id}
                      onClick={() => { setSelectedConvo(c); setPanel("chat"); }}
                      className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive
                        ? "bg-gray-200 dark:bg-reddit-dark_hover"
                        : "hover:bg-gray-50 dark:hover:bg-reddit-dark_hover"
                        }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={c.participant.avatar || defaultProfileImg}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-[#272729]"
                        />

                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className={`text-sm font-semibold truncate ${isActive ? "text-reddit-text dark:text-reddit-dark_text" : "text-reddit-text dark:text-reddit-dark_text"
                            }`}>
                            {c.participant.username}
                          </span>
                          {c.lastMessage && (
                            <span className="text-[11px] text-reddit-text_secondary dark:text-reddit-text_secondary font-medium">
                              {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm truncate pr-2 ${c.unreadCount > 0
                            ? "text-gray-900 dark:text-gray-100 font-bold"
                            : "text-reddit-text_secondary dark:text-reddit-text_secondary"
                            }`}>
                            {c.lastMessage?.sender === user?._id && "You: "}
                            {c.lastMessage?.content || "Started a chat"}
                          </span>
                          {c.unreadCount > 0 && (
                            <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* RIGHT PANEL: CONTENT - Hidden on mobile when showing threads list */}
          <section className={`${panel === 'threads' && !selectedConvo ? 'hidden lg:flex' : 'flex'} flex-1 flex-col min-w-0 bg-white dark:bg-[#1A1A1B]`}>

            {/* VIEW: New Chat */}
            {panel === "new" && (
              <div className="flex-1 flex flex-col p-4 sm:p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <button onClick={() => setPanel("threads")} className="p-2 hover:bg-gray-100 dark:hover:bg-[#272729] rounded-full transition">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-reddit-text dark:text-reddit-dark_text" />
                  </button>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">New Message</h2>
                </div>

                <div className="relative mb-6">
                  <label className="text-xs font-bold text-reddit-text_secondary dark:text-reddit-text_secondary uppercase tracking-wider mb-2 block">To:</label>
                  <input
                    autoFocus
                    className="w-full text-base sm:text-lg bg-transparent border-b-2 border-gray-200 dark:border-[#343536] py-2 outline-none focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-white placeholder-gray-400 transition-colors"
                    placeholder="Type a username..."
                    value={usersInput}
                    onChange={(e) => setUsersInput(e.target.value)}
                  />
                </div>

                <div className="flex-1 overflow-y-auto">
                  {searchLoading && <p className="text-sm text-reddit-text_secondary animate-pulse">Searching...</p>}
                  <div className="space-y-1">
                    {searchResults.map(u => (
                      <div
                        key={u._id}
                        onClick={() => handleStartNewChat(u)}
                        className="flex items-center gap-3 sm:gap-4 p-3 hover:bg-gray-50 dark:hover:bg-[#272729] rounded-xl cursor-pointer transition-colors"
                      >
                        <img src={u.avatar || defaultProfileImg} className="w-10 h-10 rounded-full object-cover" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-white">{u.username}</span>
                          <span className="text-xs text-reddit-text_secondary">u/{u.username}</span>
                        </div>
                      </div>
                    ))}
                    {usersInput && !searchLoading && searchResults.length === 0 && (
                      <div className="text-reddit-text_secondary text-sm">No user found.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: Active Chat */}
            {panel === "chat" && selectedConvo ? (
              <div className="flex flex-col h-full relative">

                {/* Chat Header */}
                <div className="h-14 sm:h-16 px-3 sm:px-6 border-b border-gray-100 dark:border-[#343536] flex items-center justify-between bg-white/80 dark:bg-[#1A1A1B]/90 backdrop-blur -mt-[1px] z-10">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Back button for mobile */}
                    <button
                      onClick={() => { setSelectedConvo(null); setPanel("threads"); }}
                      className="lg:hidden p-2 -ml-1 hover:bg-gray-100 dark:hover:bg-[#272729] rounded-full transition"
                    >
                      <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-reddit-text dark:text-reddit-dark_text" />
                    </button>
                    <div className="relative">
                      <img src={selectedConvo.participant.avatar || defaultProfileImg} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-[#343536]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">{selectedConvo.participant.username}</span>
                      <span className="text-xs text-reddit-text_secondary dark:text-reddit-text_secondary font-medium">u/{selectedConvo.participant.username}</span>
                    </div>
                  </div>
                  <button className="text-reddit-text_secondary hover:text-gray-600 dark:hover:text-gray-200 p-2">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 dark:bg-[#0f0f0f]">
                  <div className="flex flex-col items-center justify-center my-4 sm:my-6 space-y-2 opacity-60">
                    <img src={selectedConvo.participant.avatar || defaultProfileImg} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover mb-2" />
                    <p className="text-xs sm:text-sm text-reddit-text_secondary text-center px-4">This is the beginning of your chat history with <span className="font-bold">{selectedConvo.participant.username}</span>.</p>
                  </div>

                  {messages.map((m, i) => {
                    const senderId = m.sender?._id || m.sender;
                    const currentUserId = user?.id || user?._id;
                    const isMe = String(senderId) === String(currentUserId);
                    const nextSenderId = messages[i + 1]?.sender?._id || messages[i + 1]?.sender;
                    const showAvatar = !isMe && (i === messages.length - 1 || String(nextSenderId) === String(currentUserId));

                    return (
                      <div key={i} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group`}>
                        <div className={`flex max-w-[85%] sm:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"} gap-2`}>

                          {/* Avatar for 'Them' */}
                          {!isMe && (
                            <div className="w-7 sm:w-8 shrink-0 flex items-end">
                              {showAvatar ? (
                                <img src={selectedConvo.participant.avatar || defaultProfileImg} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover" />
                              ) : <div className="w-7 sm:w-8" />}
                            </div>
                          )}

                          <div className="flex flex-col gap-1">
                            <div
                              className={`px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm text-sm sm:text-[15px] leading-relaxed break-words ${isMe
                                ? "bg-blue-600 dark:bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                                : "bg-white dark:bg-[#272729] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#343536] rounded-2xl rounded-tl-sm"
                                }`}
                            >
                              {m.content}
                            </div>
                            <span className={`text-[10px] text-reddit-text_secondary dark:text-reddit-text_secondary px-1 ${isMe ? "text-right" : "text-left"} opacity-0 group-hover:opacity-100 transition-opacity`}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-2 sm:p-4 bg-white dark:bg-[#1A1A1B] border-t border-gray-100 dark:border-[#343536]">
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-end gap-1 sm:gap-2 bg-gray-100 dark:bg-[#272729] p-1.5 sm:p-2 rounded-full sm:rounded-3xl border border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-[#1A1A1B] transition-all"
                  >
                    <button type="button" className="p-2 text-reddit-text_secondary hover:text-gray-600 dark:hover:text-reddit-text dark:text-reddit-dark_text rounded-full transition-colors">
                      <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    <div className="flex-1 py-1.5 sm:py-2 px-2 sm:px-0">
                      <input
                        className="w-full bg-transparent border-none outline-none text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500"
                        placeholder="Message"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        autoComplete="off"
                      />
                    </div>

                    <button
                      type="button"
                      className="p-2 text-reddit-text_secondary hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    >
                      <FaceSmileIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className={`p-2 rounded-full transition-all duration-200 ${newMessage.trim()
                        ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                        : "bg-gray-200 dark:bg-[#343536] text-reddit-text_secondary cursor-not-allowed"
                        }`}
                    >
                      <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5 -rotate-45 translate-x-[-1px] translate-y-[1px]" />
                    </button>
                  </form>
                </div>

              </div>
            ) : (
              // Empty State (Welcome)
              panel === "threads" && (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-in">
                  <div className="w-24 h-24 bg-gradient-to-tr from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <PaperAirplaneIcon className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Your Messages</h3>
                  <p className="text-reddit-text_secondary dark:text-reddit-text_secondary max-w-sm mb-8 leading-relaxed">
                    Send private photos and messages to a friend or group. Start a new chat to verify the real-time updates!
                  </p>
                  <button
                    onClick={() => setPanel("new")}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
                  >
                    Send Message
                  </button>
                </div>
              )
            )}
          </section>
        </div>
      </div>
    </>
  );
}
