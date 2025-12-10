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

export default function ChatSidebar({ open = false, onClose = () => {} }) {
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

      {/* Floating Window: Premium Shadow & Borders */}
      <div
        ref={containerRef}
        className="fixed right-8 top-20 bottom-8 z-[1300] w-[750px] max-w-[90vw] rounded-2xl bg-white dark:bg-[#1A1A1B] border border-gray-200 dark:border-[#343536] shadow-2xl flex flex-col overflow-hidden font-sans animation-slide-up"
      >
        {/* GLOBAL HEADER */}
        <div className="h-14 flex items-center justify-between px-5 bg-white dark:bg-[#1A1A1B] border-b border-gray-100 dark:border-[#343536] shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-red-600 flex items-center justify-center text-white font-bold shadow-sm">
               <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
             </div>
             <span className="font-bold text-lg text-gray-900 dark:text-gray-100 tracking-tight">Chats</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
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
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#272729] transition-colors ml-2"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex flex-1 min-h-0 bg-white dark:bg-[#1A1A1B]">
          
          {/* LEFT SIDEBAR: THREADS */}
          <aside className="w-[320px] flex flex-col border-r border-gray-100 dark:border-[#343536]">
            
            {/* Search within sidebar? Optional, but fits "premium" */}
            <div className="p-3">
               <div className="bg-gray-100 dark:bg-[#272729] rounded-full px-4 py-2 flex items-center gap-2">
                 <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 <input 
                   placeholder="Search chats" 
                   className="bg-transparent border-none outline-none text-sm w-full text-gray-900 dark:text-gray-100 placeholder-gray-500"
                 />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
              {conversations.length === 0 ? (
                <div className="text-center mt-10 text-gray-400">
                  <p className="text-sm">No conversations yet.</p>
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive = selectedConvo?.participant?._id === c.participant._id;
                  return (
                    <div 
                      key={c.participant._id}
                      onClick={() => { setSelectedConvo(c); setPanel("chat"); }}
                      className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        isActive 
                        ? "bg-blue-50 dark:bg-[#2A3C4E]" 
                        : "hover:bg-gray-50 dark:hover:bg-[#272729]"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img 
                          src={c.participant.avatar || defaultProfileImg} 
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-[#272729]" 
                        />
                        {/* Mock Online Status */}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-[#1A1A1B]"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className={`text-sm font-semibold truncate ${
                            isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"
                          }`}>
                            {c.participant.username}
                          </span>
                          {c.lastMessage && (
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                              {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                           <span className={`text-sm truncate pr-2 ${
                             c.unreadCount > 0 
                             ? "text-gray-900 dark:text-gray-100 font-bold" 
                             : "text-gray-500 dark:text-gray-400"
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

          {/* RIGHT PANEL: CONTENT */}
          <section className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1A1A1B]">
            
            {/* VIEW: New Chat */}
            {panel === "new" && (
               <div className="flex-1 flex flex-col p-6 animate-fade-in">
                 <div className="flex items-center gap-3 mb-8">
                   <button onClick={() => setPanel("threads")} className="p-2 hover:bg-gray-100 dark:hover:bg-[#272729] rounded-full transition">
                     <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                   </button>
                   <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">New Message</h2>
                 </div>

                 <div className="relative mb-6">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">To:</label>
                    <input
                      autoFocus
                      className="w-full text-lg bg-transparent border-b-2 border-gray-200 dark:border-[#343536] py-2 outline-none focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-white placeholder-gray-400 transition-colors"
                      placeholder="Type a username..."
                      value={usersInput}
                      onChange={(e) => setUsersInput(e.target.value)}
                    />
                 </div>

                 <div className="flex-1 overflow-y-auto">
                    {searchLoading && <p className="text-sm text-gray-500 animate-pulse">Searching...</p>}
                    <div className="space-y-1">
                      {searchResults.map(u => (
                        <div 
                          key={u._id}
                          onClick={() => handleStartNewChat(u)}
                          className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-[#272729] rounded-xl cursor-pointer transition-colors"
                        >
                          <img src={u.avatar || defaultProfileImg} className="w-10 h-10 rounded-full object-cover" />
                          <div className="flex flex-col">
                             <span className="font-semibold text-gray-900 dark:text-white">{u.username}</span>
                             <span className="text-xs text-gray-500">u/{u.username}</span>
                          </div>
                        </div>
                      ))}
                      {usersInput && !searchLoading && searchResults.length === 0 && (
                          <div className="text-gray-500 text-sm">No user found.</div>
                      )}
                    </div>
                 </div>
               </div>
            )}

            {/* VIEW: Active Chat */}
            {panel === "chat" && selectedConvo ? (
              <div className="flex flex-col h-full relative">
                
                {/* Chat Header */}
                <div className="h-16 px-6 border-b border-gray-100 dark:border-[#343536] flex items-center justify-between bg-white/80 dark:bg-[#1A1A1B]/90 backdrop-blur -mt-[1px] z-10">
                   <div className="flex items-center gap-3">
                     <div className="relative">
                       <img src={selectedConvo.participant.avatar || defaultProfileImg} className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-[#343536]" />
                       <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1A1A1B]"></div>
                     </div>
                     <div className="flex flex-col">
                       <span className="font-bold text-gray-900 dark:text-gray-100 text-base">{selectedConvo.participant.username}</span>
                       <span className="text-xs text-green-600 dark:text-green-500 font-medium">Online now</span>
                     </div>
                   </div>
                   <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </button>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0f0f0f]">
                  <div className="flex flex-col items-center justify-center my-6 space-y-2 opacity-60">
                     <img src={selectedConvo.participant.avatar || defaultProfileImg} className="w-16 h-16 rounded-full object-cover mb-2" />
                     <p className="text-sm text-gray-500 text-center">This is the beginning of your chat history with <span className="font-bold">{selectedConvo.participant.username} asd</span>.</p>
                  </div>

                  {messages.map((m, i) => {
                    const isMe = m.sender._id === user?._id || m.sender === user?._id;
                    const showAvatar = !isMe && (i === messages.length - 1 || messages[i + 1]?.sender._id === user?._id); // Simple logic for now

                    return (
                      <div key={i} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group`}>
                         <div className={`flex max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"} gap-2`}>
                            
                            {/* Avatar for 'Them' */}
                            {!isMe && (
                               <div className="w-8 shrink-0 flex items-end">
                                 {showAvatar ? (
                                   <img src={selectedConvo.participant.avatar || defaultProfileImg} className="w-8 h-8 rounded-full object-cover" />
                                 ) : <div className="w-8" />}
                               </div>
                            )}

                            <div className="flex flex-col gap-1">
                               <div 
                                 className={`px-4 py-2.5 shadow-sm text-[15px] leading-relaxed break-words ${
                                    isMe 
                                    ? "bg-blue-600 dark:bg-blue-600 text-white rounded-2xl rounded-tr-sm" 
                                    : "bg-white dark:bg-[#272729] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#343536] rounded-2xl rounded-tl-sm"
                                 }`}
                               >
                                  {m.content}
                               </div>
                               <span className={`text-[10px] text-gray-400 dark:text-gray-500 px-1 ${isMe ? "text-right" : "text-left"} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                 {new Date(m.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                               </span>
                            </div>

                         </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-[#1A1A1B] border-t border-gray-100 dark:border-[#343536]">
                   <form 
                     onSubmit={handleSendMessage}
                     className="flex items-end gap-2 bg-gray-100 dark:bg-[#272729] p-2 rounded-3xl border border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-[#1A1A1B] transition-all ring-offset-2 ring-offset-white dark:ring-offset-[#1A1A1B]"
                   >
                     <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors">
                       <PlusIcon className="w-6 h-6" />
                     </button>
                     
                     <div className="flex-1 py-2">
                       <input 
                         className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 max-h-32 resize-none"
                         placeholder="Message"
                         value={newMessage}
                         onChange={(e) => setNewMessage(e.target.value)}
                         autoComplete="off"
                       />
                     </div>

                     <button 
                       type="button"
                       disabled={!newMessage.trim()} 
                       className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                     >
                       <FaceSmileIcon className="w-6 h-6" />
                     </button>
                     
                     <button 
                       type="submit"
                       disabled={!newMessage.trim()} 
                       className={`p-2 rounded-full transition-all duration-200 ${
                         newMessage.trim() 
                         ? "bg-blue-600 text-white shadow-md hover:bg-blue-700 transform hover:scale-105" 
                         : "bg-gray-200 dark:bg-[#343536] text-gray-400 cursor-not-allowed"
                       }`}
                     >
                       <PaperAirplaneIcon className="w-5 h-5 -rotate-45 translate-x-[-1px] translate-y-[1px]" />
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
                   <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8 leading-relaxed">
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
