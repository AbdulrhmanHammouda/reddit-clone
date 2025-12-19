import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  XMarkIcon,
  PlusIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import EmojiPicker from "emoji-picker-react";
import useAuth from "../hooks/useAuth";
import api from "../api/axios";
import defaultProfileImg from "../assets/default_profile.jpeg";

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [sending, setSending] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get("/messages");
      if (res.data.success) {
        setConversations(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Messages for active chat
  const fetchMessages = useCallback(async () => {
    if (!selectedUser) return;
    try {
      const res = await api.get(`/messages/${selectedUser._id}`);
      if (res.data.success) {
        setMessages(res.data.data);
        setConversations(prev =>
          prev.map(c =>
            c.participant._id === selectedUser._id
              ? { ...c, unreadCount: 0 }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  }, [selectedUser]);

  // Polling
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, fetchMessages]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setAttachmentPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !selectedUser || sending) return;

    setSending(true);

    // Optimistic update for text-only messages
    if (!attachment) {
      const tempMessage = {
        _id: Date.now(),
        sender: { _id: user.id || user._id, username: user.username },
        receiver: selectedUser,
        content: newMessage,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempMessage]);
    }

    const messageContent = newMessage;
    setNewMessage("");

    try {
      const formData = new FormData();
      formData.append("receiverId", selectedUser._id);
      if (messageContent) formData.append("content", messageContent);
      if (attachment) formData.append("attachment", attachment);

      await api.post("/messages", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      removeAttachment();
      fetchMessages();
      fetchConversations();
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/search?q=${query}`);
      if (res.data.success) {
        setSearchResults(res.data.data.users || []);
      }
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const startNewChat = (targetUser) => {
    setSelectedUser(targetUser);
    setShowNewChat(false);
    setSearchQuery("");
    const existing = conversations.find(c => c.participant._id === targetUser._id);
    if (!existing) {
      setConversations(prev => [{ participant: targetUser, lastMessage: null, unreadCount: 0 }, ...prev]);
    }
  };

  // Render message content including attachments
  const renderMessageContent = (msg) => {
    return (
      <>
        {msg.attachment?.url && (
          <div className="mb-2">
            {msg.attachment.type === "image" ? (
              <img
                src={msg.attachment.url}
                alt="Attachment"
                className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(msg.attachment.url, "_blank")}
              />
            ) : msg.attachment.type === "video" ? (
              <video
                src={msg.attachment.url}
                controls
                className="max-w-full max-h-64 rounded-lg"
              />
            ) : (
              <a
                href={msg.attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:underline"
              >
                <PhotoIcon className="w-5 h-5" />
                {msg.attachment.filename || "Download file"}
              </a>
            )}
          </div>
        )}
        {msg.content && <span>{msg.content}</span>}
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-reddit-page dark:bg-reddit-dark_bg text-reddit-text dark:text-reddit-dark_text flex flex-col md:flex-row font-sans">

      {/* 1. LEFT SIDEBAR */}
      <div className={`${selectedUser && !showMobileSidebar ? 'hidden' : 'flex'} md:flex w-full md:w-[300px] lg:w-[350px] border-r border-reddit-border dark:border-reddit-dark_divider bg-reddit-card dark:bg-reddit-dark_card flex-col`}>
        <div className="h-14 md:h-16 px-4 md:px-5 flex items-center justify-between border-b border-reddit-border dark:border-reddit-dark_divider shrink-0">
          <h2 className="font-bold text-lg md:text-xl tracking-tight">Chats</h2>
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover rounded-full transition-colors"
            title="New Chat"
          >
            <PlusIcon className="w-5 h-5 md:w-6 md:h-6 text-reddit-text_secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {conversations.length === 0 && !loading && (
            <div className="text-center mt-10 text-reddit-text_secondary">
              <p>No conversations yet.</p>
            </div>
          )}
          {conversations.map((convo) => {
            const isActive = selectedUser?._id === convo.participant._id;
            return (
              <div
                key={convo.participant._id}
                onClick={() => {
                  setSelectedUser(convo.participant);
                  setShowMobileSidebar(false);
                }}
                className={`group flex items-center gap-3 md:gap-4 p-2.5 md:p-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'bg-reddit-hover dark:bg-reddit-dark_hover' : 'hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover'}`}
              >
                <div className="relative">
                  <img src={convo.participant.avatar || defaultProfileImg} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-reddit-border dark:ring-reddit-dark_divider" />
                  {convo.unreadCount > 0 && <div className="absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 bg-red-500 rounded-full border-2 border-reddit-card dark:border-reddit-dark_card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold truncate">{convo.participant.username}</span>
                    {convo.lastMessage && (
                      <span className="text-xs text-reddit-text_secondary font-medium">
                        {new Date(convo.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className={`text-sm truncate ${convo.unreadCount > 0 ? 'font-bold' : 'text-reddit-text_secondary'}`}>
                    {String(convo.lastMessage?.sender) === String(user?.id || user?._id) && "You: "}
                    {convo.lastMessage?.attachment ? "📎 Attachment" : convo.lastMessage?.content || "No messages yet"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN CHAT AREA */}
      <div className={`${!selectedUser || showMobileSidebar ? 'hidden' : 'flex'} md:flex flex-1 flex-col bg-reddit-page dark:bg-reddit-dark_bg relative`}>
        {selectedUser ? (
          <>
            <div className="h-14 md:h-16 px-4 md:px-6 border-b border-reddit-border dark:border-reddit-dark_divider flex items-center gap-3 md:gap-4 bg-reddit-card/90 dark:bg-reddit-dark_card/90 backdrop-blur shrink-0 sticky top-0 z-10">
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="md:hidden p-2 -ml-2 rounded-full hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-reddit-text_secondary" />
              </button>
              <img src={selectedUser.avatar || defaultProfileImg} className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover ring-2 ring-reddit-border dark:ring-reddit-dark_divider" />
              <div className="flex flex-col">
                <span className="font-bold text-base md:text-lg leading-tight">{selectedUser.username}</span>
                <span className="text-xs text-reddit-text_secondary font-medium">u/{selectedUser.username}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-reddit-page dark:bg-reddit-dark_bg">
              <div className="flex flex-col items-center justify-center my-6 md:my-10 space-y-2 md:space-y-3 opacity-50">
                <img src={selectedUser.avatar || defaultProfileImg} className="w-16 h-16 md:w-24 md:h-24 rounded-full object-cover" />
                <p className="text-reddit-text_secondary text-sm md:text-base text-center">This is the start of your history with <span className="font-bold text-reddit-text dark:text-reddit-dark_text">{selectedUser.username}</span></p>
              </div>

              {messages.map((msg, idx) => {
                const senderId = msg.sender?._id || msg.sender;
                const currentUserId = user?.id || user?._id;
                const isMe = String(senderId) === String(currentUserId);
                return (
                  <div key={idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`flex max-w-[85%] md:max-w-[65%] gap-2 md:gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <img src={selectedUser.avatar || defaultProfileImg} className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover self-end mb-1" />
                      )}
                      <div className="flex flex-col gap-1">
                        <div className={`px-4 py-2.5 md:px-5 md:py-3 text-sm md:text-[15px] leading-relaxed shadow-sm break-words ${isMe
                          ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                          : 'bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-2xl rounded-tl-sm'
                          }`}>
                          {renderMessageContent(msg)}
                        </div>
                        <span className={`text-[10px] text-reddit-text_secondary px-1 ${isMe ? 'text-right' : 'text-left'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area with attachments and emoji */}
            <div className="p-4 md:p-6 pt-2 bg-reddit-card dark:bg-reddit-dark_card border-t border-reddit-border dark:border-reddit-dark_divider">
              {/* Attachment Preview */}
              {attachment && (
                <div className="mb-3 p-3 bg-reddit-hover dark:bg-reddit-dark_hover rounded-xl flex items-center gap-3">
                  {attachmentPreview ? (
                    <img src={attachmentPreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                  ) : (
                    <div className="w-16 h-16 bg-reddit-border dark:bg-reddit-dark_divider rounded-lg flex items-center justify-center">
                      <PhotoIcon className="w-8 h-8 text-reddit-text_secondary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-reddit-text_secondary">{(attachment.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={removeAttachment} className="p-1 hover:bg-reddit-border dark:hover:bg-reddit-dark_divider rounded-full">
                    <XMarkIcon className="w-5 h-5 text-reddit-text_secondary" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="bg-reddit-hover dark:bg-reddit-dark_hover p-2 rounded-3xl flex items-end gap-2 border border-transparent focus-within:border-blue-500 transition-colors relative">
                {/* File Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-reddit-text_secondary hover:text-reddit-text dark:hover:text-reddit-dark_text rounded-full transition-colors"
                  title="Add attachment"
                >
                  <PlusIcon className="w-6 h-6" />
                </button>

                <div className="flex-1 py-2 px-2">
                  <input
                    className="w-full bg-transparent border-none outline-none text-reddit-text dark:text-reddit-dark_text placeholder-reddit-text_secondary"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                </div>

                {/* Emoji Picker */}
                <div className="relative" ref={emojiPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-reddit-text_secondary hover:text-reddit-text dark:hover:text-reddit-dark_text rounded-full transition-colors"
                    title="Add emoji"
                  >
                    <FaceSmileIcon className="w-6 h-6" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 right-0 z-50">
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme="auto"
                        width={320}
                        height={400}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !attachment) || sending}
                  className={`p-2.5 rounded-full transition-all duration-200 ${(newMessage.trim() || attachment) && !sending
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                    : "bg-reddit-border dark:bg-reddit-dark_divider text-reddit-text_secondary cursor-not-allowed"
                    }`}
                >
                  <PaperAirplaneIcon className="w-5 h-5 -rotate-45 translate-x-[-1px] translate-y-[1px]" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-reddit-hover dark:bg-reddit-dark_hover rounded-full flex items-center justify-center mb-6 shadow-inner">
              <PaperAirplaneIcon className="w-12 h-12 md:w-16 md:h-16 text-reddit-text_secondary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Welcome to your inbox</h2>
            <p className="text-reddit-text_secondary max-w-md text-base md:text-lg">Select a chat from the left or start a new conversation.</p>
            <button onClick={() => setShowNewChat(true)} className="mt-8 px-6 md:px-8 py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all">
              Start New Chat
            </button>
          </div>
        )}
      </div>

      {/* 3. NEW CHAT MODAL */}
      {showNewChat && (
        <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex justify-center pt-32" onClick={() => setShowNewChat(false)}>
          <div className="w-[500px] max-w-[90vw] h-[600px] max-h-[80vh] bg-reddit-card dark:bg-reddit-dark_card rounded-2xl border border-reddit-border dark:border-reddit-dark_divider shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-reddit-border dark:border-reddit-dark_divider flex items-center gap-4">
              <h3 className="text-xl font-bold flex-1">New Message</h3>
              <button onClick={() => setShowNewChat(false)} className="p-1 hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover rounded-full transition-colors">
                <XMarkIcon className="w-6 h-6 text-reddit-text_secondary" />
              </button>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="relative mb-6">
                <MagnifyingGlassIcon className="absolute left-0 top-3 w-5 h-5 text-reddit-text_secondary" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search people..."
                  className="w-full bg-transparent border-b border-reddit-border dark:border-reddit-dark_divider pl-8 py-2 text-lg outline-none focus:border-blue-500 text-reddit-text dark:text-reddit-dark_text placeholder-reddit-text_secondary transition-colors"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="overflow-y-auto flex-1 space-y-2">
                {searchResults.map(u => (
                  <div key={u._id} onClick={() => { startNewChat(u); setShowMobileSidebar(false); }} className="flex items-center gap-3 md:gap-4 p-2.5 md:p-3 hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover rounded-xl cursor-pointer transition-colors">
                    <img src={u.avatar || defaultProfileImg} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" />
                    <div>
                      <div className="font-bold">{u.username}</div>
                      <div className="text-sm text-reddit-text_secondary">u/{u.username}</div>
                    </div>
                  </div>
                ))}
                {searchQuery && searchResults.length === 0 && <div className="text-center text-reddit-text_secondary mt-10">No users found</div>}
                {!searchQuery && <div className="text-center text-reddit-text_secondary mt-10 text-sm">Start typing to search for users</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close button */}
      <button
        className="absolute top-4 right-4 md:top-6 md:right-6 text-reddit-text_secondary hover:text-reddit-text dark:hover:text-reddit-dark_text p-2 rounded-full hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
        onClick={() => navigate("/")}
      >
        <div className="sr-only">Close</div>
        <XMarkIcon className="w-6 h-6 md:w-8 md:h-8" />
      </button>
    </div>
  );
}
