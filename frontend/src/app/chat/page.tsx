'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { chatApi, ChatRow, Message, getWebSocketUrl, User, getCurrentUser } from '@/lib/api';
import { MessageSquare, Send, Activity, User as UserIcon, Heart } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const otherIdParam = searchParams.get('other_id');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRow | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat lists
  const loadChats = async (selectOtherId?: number) => {
    try {
      const data = await chatApi.list();
      setChats(data);
      
      if (selectOtherId) {
        const active = data.find(c => c.other_user.id === selectOtherId);
        if (active) {
          setActiveChat(active);
          loadMessages(selectOtherId);
        } else {
          // If not in chat rows, fetch user directory to create a stub chat row
          const users = await chatApi.users();
          const target = users.find(u => u.id === selectOtherId);
          if (target) {
            const newRow: ChatRow = {
              chat_id: 0,
              other_user: target,
              latest_message: '',
              unread_count: 0,
              timestamp: new Date().toISOString(),
            };
            setActiveChat(newRow);
            setMessages([]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load chat rows:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherId: number) => {
    try {
      const data = await chatApi.messages(otherId);
      setMessages(data);
      // Mark as read
      await chatApi.markRead(otherId);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    const cur = getCurrentUser();
    if (!cur) {
      router.push('/login');
      return;
    }
    setCurrentUser(cur);

    const selectId = otherIdParam ? Number(otherIdParam) : undefined;
    loadChats(selectId);
  }, [otherIdParam]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!currentUser) return;

    const wsUrl = getWebSocketUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Expected payload fields: id, chat_id, sender_id, receiver_id, content, created_at
      
      const newMsg: Message = {
        id: data.id,
        chat_id: data.chat_id,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        content: data.content,
        is_read: false,
        created_at: data.created_at,
      };

      // Append if it belongs to the active conversation
      if (activeChat && (
        (newMsg.sender_id === currentUser.id && newMsg.receiver_id === activeChat.other_user.id) ||
        (newMsg.sender_id === activeChat.other_user.id && newMsg.receiver_id === currentUser.id)
      )) {
        setMessages((prev) => [...prev, newMsg]);
        // Call read ack
        chatApi.markRead(activeChat.other_user.id).catch(console.error);
      } else {
        // Increment unread count or reload chat lists
        loadChats();
      }
    };

    ws.onclose = () => {
      console.log('WS connection closed. Reconnecting...');
    };

    return () => {
      ws.close();
    };
  }, [currentUser, activeChat]);

  const handleSelectChat = (row: ChatRow) => {
    setActiveChat(row);
    setMessages([]);
    loadMessages(row.other_user.id);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChat || !wsRef.current) return;

    const payload = {
      receiver_id: activeChat.other_user.id,
      content: inputMessage.trim(),
    };

    wsRef.current.send(JSON.stringify(payload));
    setInputMessage('');
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100 h-screen overflow-hidden">
      <Navigation />

      <main className="flex-1 flex overflow-hidden border-t lg:border-t-0 border-slate-900">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Activity className="w-10 h-10 text-red-500 animate-spin" />
            <span className="text-slate-500 font-semibold">Tuning WebSocket Hub...</span>
          </div>
        ) : (
          <div className="flex-1 flex h-full overflow-hidden">
            {/* Left Sidebar - Chat list */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-slate-900 flex flex-col bg-slate-950 h-full ${
              activeChat ? 'hidden md:flex' : 'flex'
            }`}>
              <div className="p-6 border-b border-slate-900">
                <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-red-500" /> Active Conversations
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {chats.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                    <MessageSquare className="w-10 h-10 text-slate-800" />
                    <span className="font-bold text-xs text-slate-500">No Chats Started</span>
                    <button 
                      onClick={() => router.push('/users')}
                      className="text-xs text-red-400 font-bold hover:underline"
                    >
                      Find a donor to chat with
                    </button>
                  </div>
                ) : (
                  chats.map((row) => {
                    const isSelected = activeChat?.other_user.id === row.other_user.id;
                    return (
                      <button
                        key={row.other_user.id}
                        onClick={() => handleSelectChat(row)}
                        className={`w-full p-4.5 rounded-2xl border text-left flex gap-3 transition ${
                          isSelected 
                            ? 'bg-red-950/20 border-red-900/35 text-red-500' 
                            : 'bg-slate-950 border-slate-900/40 hover:border-slate-800/70'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-red-950/50 border border-red-900/20 flex items-center justify-center font-bold text-red-500 uppercase text-xs">
                          {row.other_user.username.substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-100 text-sm truncate">{row.other_user.username}</span>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {row.timestamp ? new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 truncate">{row.latest_message || 'Start chatting...'}</p>
                        </div>
                        {row.unread_count > 0 && (
                          <span className="bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center self-center shrink-0">
                            {row.unread_count}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Chat Panel */}
            <div className={`flex-1 flex flex-col h-full bg-slate-950/60 ${
              activeChat ? 'flex' : 'hidden md:flex items-center justify-center'
            }`}>
              {activeChat ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Active Header */}
                  <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-slate-950/80">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveChat(null)} 
                        className="md:hidden text-slate-400 hover:text-slate-100 mr-2 text-sm font-bold"
                      >
                        ← Back
                      </button>
                      <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-800/35 flex items-center justify-center font-extrabold text-red-500 uppercase text-sm">
                        {activeChat.other_user.username.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm">{activeChat.other_user.username}</h4>
                        <p className="text-[10px] text-red-400 font-bold mt-0.5">Blood: {activeChat.other_user.profile?.blood_type || 'A+'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                    {messages.length === 0 ? (
                      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                        <MessageSquare className="w-10 h-10 text-slate-800" />
                        <span className="text-xs text-slate-500">No message history. Send a message to start conversation.</span>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMine = msg.sender_id === currentUser?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[70%] ${
                              isMine ? 'self-end items-end' : 'self-start items-start'
                            }`}
                          >
                            <div className={`p-4.5 rounded-3xl text-sm leading-relaxed ${
                              isMine 
                                ? 'bg-red-600 text-white rounded-br-none shadow-md shadow-red-950/20' 
                                : 'bg-slate-900 text-slate-100 rounded-bl-none border border-slate-800/80'
                            }`}>
                              {msg.content}
                            </div>
                            <span className="text-[9px] text-slate-500 mt-1.5 px-1.5">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Box */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-900 bg-slate-950">
                    <div className="relative flex gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Write your message..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800/80 focus:border-red-600 focus:outline-none rounded-2xl py-3 px-5 text-sm font-semibold transition"
                      />
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-500 text-white p-3 rounded-2xl shadow-lg shadow-red-950/25 transition duration-150 transform hover:scale-[1.03] active:scale-[0.97]"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3.5 text-center px-6">
                  <div className="bg-slate-900/50 border border-slate-800/80 p-5.5 rounded-full text-slate-600">
                    <MessageSquare className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-100 text-base">Select a Conversation</h3>
                    <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-normal">
                      Pick a contact from the panel on the left or search the donor directory to coordinate blood transfers.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
