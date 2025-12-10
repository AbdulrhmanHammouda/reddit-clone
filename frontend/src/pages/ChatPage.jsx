import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  PaperAirplaneIcon, 
  FaceSmileIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
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
  const [loading, setLoading] = useState(true);
  
  // Refs
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        // Mark read local
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const tempMessage = {
      _id: Date.now(),
      sender: { _id: user._id, username: user.username },
      receiver: selectedUser,
      content: newMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");

    try {
      await api.post("/messages", {
        receiverId: selectedUser._id,
        content: tempMessage.content
      });
      fetchMessages();
      fetchConversations();
    } catch (err) {
      console.error("Failed to send message", err);
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

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1416] text-gray-100 flex font-sans">
      
      {/* 1. LEFT SIDEBAR */}
      <div className="w-[350px] border-r border-[#1e2324] bg-[#0f1112] flex flex-col">
        {/* Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#1e2324] shrink-0">
           <h2 className="font-bold text-xl tracking-tight">Chats</h2>
           <button 
             onClick={() => setShowNewChat(true)} 
             className="p-2 hover:bg-[#1e2324] rounded-full transition-colors"
             title="New Chat"
           >
             <PlusIcon className="w-6 h-6 text-gray-400" />
           </button>
        </div>
        
        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-800">
          {conversations.length === 0 && !loading && (
             <div className="text-center mt-10 text-gray-500">
               <p>No conversations yet.</p>
             </div>
          )}
          {conversations.map((convo) => {
            const isActive = selectedUser?._id === convo.participant._id;
            return (
              <div
                key={convo.participant._id}
                onClick={() => setSelectedUser(convo.participant)}
                className={`group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  isActive ? 'bg-[#2A3437]' : 'hover:bg-[#191C1D]'
                }`}
              >
                <div className="relative">
                  <img src={convo.participant.avatar || defaultProfileImg} className="w-12 h-12 rounded-full object-cover ring-2 ring-[#0f1112]" />
                  {convo.unreadCount > 0 && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#0f1112]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`font-semibold truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {convo.participant.username}
                    </span>
                    {convo.lastMessage && (
                       <span className="text-xs text-gray-500 font-medium">{new Date(convo.lastMessage.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className={`text-sm truncate ${convo.unreadCount > 0 ? 'text-white font-bold' : 'text-gray-500'}`}>
                     {convo.lastMessage?.sender === user?._id && "You: "}
                     {convo.lastMessage?.content || "No messages yet"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col bg-[#0B1416] relative">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="h-16 px-6 border-b border-[#1e2324] flex items-center gap-4 bg-[#0B1416]/90 backdrop-blur shrink-0 sticky top-0 z-10">
              <div className="relative">
                 <img src={selectedUser.avatar || defaultProfileImg} className="w-10 h-10 rounded-full object-cover ring-2 ring-[#1e2324]" />
                 <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0B1416]"></div>
              </div>
              <div className="flex flex-col">
                 <span className="font-bold text-lg leading-tight">{selectedUser.username}</span>
                 <span className="text-xs text-green-500 font-medium">Online</span>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-col items-center justify-center my-10 space-y-3 opacity-50">
                <img src={selectedUser.avatar || defaultProfileImg} className="w-24 h-24 rounded-full object-cover" />
                <p className="text-gray-400">This is the start of your history with <span className="font-bold text-white">{selectedUser.username}</span></p>
              </div>

              {messages.map((msg, idx) => {
                const isMe = msg.sender._id === user?._id || msg.sender === user?._id;
                return (
                  <div key={idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`flex max-w-[65%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                       {!isMe && (
                         <img src={selectedUser.avatar || defaultProfileImg} className="w-8 h-8 rounded-full object-cover self-end mb-1" />
                       )}
                       
                       <div className="flex flex-col gap-1">
                          <div className={`px-5 py-3 text-[15px] leading-relaxed shadow-sm break-words ${
                            isMe 
                            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                            : 'bg-[#1e2324] text-gray-100 border border-[#2A3437] rounded-2xl rounded-tl-sm'
                          }`}>
                            {msg.content}
                          </div>
                          <span className={`text-[10px] text-gray-500 px-1 ${isMe ? 'text-right' : 'text-left'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 pt-2">
               <form onSubmit={handleSendMessage} className="bg-[#1e2324] p-2 rounded-3xl flex items-end gap-2 border border-transparent focus-within:border-gray-600 transition-colors">
                  <button type="button" className="p-2 text-gray-400 hover:text-white rounded-full transition-colors">
                    <PlusIcon className="w-6 h-6" />
                  </button>
                  <div className="flex-1 py-2">
                    <input 
                       className="w-full bg-transparent border-none outline-none text-white placeholder-gray-500" 
                       placeholder="Message..."
                       value={newMessage}
                       onChange={(e) => setNewMessage(e.target.value)}
                    />
                  </div>
                  <button type="button" className="p-2 text-gray-400 hover:text-blue-400 rounded-full transition-colors">
                     <FaceSmileIcon className="w-6 h-6" />
                  </button>
                  <button 
                     type="submit" 
                     disabled={!newMessage.trim()} 
                     className={`p-2 rounded-full transition-transform ${newMessage.trim() ? "bg-blue-600 text-white hover:scale-105" : "bg-[#2A3437] text-gray-500"}`}
                  >
                     <PaperAirplaneIcon className="w-5 h-5 -rotate-45 translate-x-[-1px] translate-y-[1px]" />
                  </button>
               </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0B1416]">
             <div className="w-32 h-32 bg-[#1e2324] rounded-full flex items-center justify-center mb-6 shadow-inner">
                <PaperAirplaneIcon className="w-16 h-16 text-gray-600" />
             </div>
             <h2 className="text-3xl font-bold text-white mb-3">Welcome to your inbox</h2> 
             <p className="text-gray-400 max-w-md text-lg">Select a chat from the left or start a new conversation to begin messaging effortlessly.</p>
             <button onClick={() => setShowNewChat(true)} className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all">
                Start New Chat
             </button>
          </div>
        )}
      </div>

      {/* 3. NEW CHAT MODAL */}
      {showNewChat && (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex justify-center pt-32" onClick={() => setShowNewChat(false)}>
          <div className="w-[500px] h-[600px] bg-[#1a1a1b] rounded-2xl border border-[#343536] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-[#343536] flex items-center gap-4">
              <h3 className="text-xl font-bold flex-1">New Message</h3>
              <button onClick={() => setShowNewChat(false)} className="p-1 hover:bg-[#272729] rounded-full">
                <XMarkIcon className="w-6 h-6 text-gray-400" /> {/* Corrected Icon Name if needed, reusing XMark from context or adding import */}
              </button>
            </div>
            
            <div className="p-6">
              <div className="relative mb-6">
                <MagnifyingGlassIcon className="absolute left-0 top-3 w-5 h-5 text-gray-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search people..."
                  className="w-full bg-transparent border-b border-[#343536] pl-8 py-2 text-lg outline-none focus:border-blue-500 text-white placeholder-gray-600"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              <div className="overflow-y-auto max-h-[400px] space-y-2">
                {searchResults.map(u => (
                  <div key={u._id} onClick={() => startNewChat(u)} className="flex items-center gap-4 p-3 hover:bg-[#272729] rounded-xl cursor-pointer">
                    <img src={u.avatar || defaultProfileImg} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <div className="font-bold text-gray-100">{u.username}</div>
                      <div className="text-sm text-gray-500">u/{u.username}</div>
                    </div>
                  </div>
                ))}
                {searchQuery && searchResults.length === 0 && <div className="text-center text-gray-500 mt-10">No users found</div>}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Close button */}
      <button className="absolute top-6 right-6 text-gray-500 hover:text-white p-2 rounded-full hover:bg-[#1e2324] transition-colors" onClick={() => navigate("/")}>
        <div className="sr-only">Close</div>
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

function XMarkIcon({className}) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
}
