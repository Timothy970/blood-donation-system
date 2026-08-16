'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Send, MessageSquare, User as UserIcon, Activity, ArrowLeft } from 'lucide-react';
import { chatApi, getCurrentUser, ChatRow, Message, getWebSocketUrl } from '@/lib/api';

function ChatContent() {
  const searchParams = useSearchParams();
  const otherIdParam = searchParams.get('other_id');

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

  const loadChats = async (selectOtherId?: number) => {
    try {
      const data = await chatApi.list();
      setChats(data || []);

      if (selectOtherId) {
        const active = data?.find(c => c.other_user.id === selectOtherId);
        if (active) {
          setActiveChat(active);
          loadMessages(selectOtherId);
        } else {
          const users = await chatApi.users();
          const target = users?.find(u => u.id === selectOtherId);
          if (target) {
            const newRow: ChatRow = {
              chat_id: 0,
              other_user: {
                id: target.id,
                username: target.username,
                email: target.email,
                profile: target.profile,
              },
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
      console.error('Failed to load chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherId: number) => {
    try {
      const data = await chatApi.messages(otherId);
      setMessages(data || []);
      await chatApi.markRead(otherId);
      window.dispatchEvent(new Event('chatUpdate'));
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    const selectId = otherIdParam ? Number(otherIdParam) : undefined;
    loadChats(selectId);
  }, [otherIdParam]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !activeChat) return;

    const wsUrl = getWebSocketUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WS connected to Chat Hub');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const newMsg: Message = {
        id: data.id,
        chat_id: data.chat_id,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        content: data.content,
        is_read: false,
        created_at: data.created_at,
      };

      if (
        (newMsg.sender_id === user.id && newMsg.receiver_id === activeChat.other_user.id) ||
        (newMsg.sender_id === activeChat.other_user.id && newMsg.receiver_id === user.id)
      ) {
        setMessages((prev) => [...prev, newMsg]);
        chatApi.markRead(activeChat.other_user.id).catch(console.error);
        
        setChats(prevChats => prevChats.map(c => 
          c.other_user.id === activeChat.other_user.id 
            ? { ...c, latest_message: newMsg.content, unread_count: 0, timestamp: newMsg.created_at } 
            : c
        ));
      } else {
        loadChats();
      }

      window.dispatchEvent(new Event('chatUpdate'));
    };

    ws.onclose = () => {
      console.log('WS disconnected');
    };

    return () => {
      ws.close();
    };
  }, [activeChat]);

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

  const currentUser = getCurrentUser();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA] dark:bg-[#131314] text-[#1A1A1A] dark:text-[#E5E2E3] h-screen overflow-hidden selection:bg-[#FF0033] selection:text-white">
      <Navigation />

      <main className="flex-1 flex overflow-hidden border-t lg:border-t-0 border-[#DEE2E6] dark:border-[#2A2A2B]">
        {/* Chat List Sidebar */}
        <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-[#DEE2E6] dark:border-[#2A2A2B] bg-white/50 dark:bg-[#0E0E0F]/50 flex-col`}>
          <div className="p-4 border-b border-[#DEE2E6] dark:border-[#2A2A2B]">
            <h2 className="font-headline font-bold text-lg text-[#1A1A1A] dark:text-[#E5E2E3] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#FF5357]" />
              <span>Encrypted Live Chat</span>
            </h2>
            <p className="text-[10px] font-mono-hud text-[#0096C7] dark:text-[#00F1FE] mt-0.5 uppercase tracking-wider">REAL-TIME WEBSOCKET SECURE HUB</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-[#6C757D] dark:text-[#919095]">
                <Activity className="w-6 h-6 text-[#FF5357] animate-spin" />
                <span className="text-xs font-mono-hud">CONNECTING CHANNELS...</span>
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-12 px-4 text-[#6C757D] dark:text-[#919095]">
                <p className="font-bold text-sm text-[#1A1A1A] dark:text-[#E5E2E3]">No Active Conversations</p>
                <p className="text-xs mt-1">Browse the Donors Directory to initiate direct messaging with compatibles.</p>
              </div>
            ) : (
              chats.map((row) => {
                const isSelected = activeChat?.other_user.id === row.other_user.id;
                return (
                  <button
                    key={row.chat_id || row.other_user.id}
                    onClick={() => handleSelectChat(row)}
                    className={`w-full text-left p-3.5 rounded-2xl transition border flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF0033]/10 dark:bg-[#1C1B1C] border-[#FF5357]/40 shadow-sm'
                        : 'bg-white dark:bg-[#1C1B1C]/40 border-[#DEE2E6] dark:border-[#2A2A2B] hover:bg-[#F1F3F5] dark:hover:bg-[#1C1B1C]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#DEE2E6] dark:bg-[#2A2A2B] border border-[#FF5357]/40 flex items-center justify-center font-bold text-xs text-[#FF5357] uppercase shrink-0">
                      {row.other_user.username.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-sm text-[#1A1A1A] dark:text-[#E5E2E3] truncate">{row.other_user.username}</p>
                        <span className="text-[10px] font-mono-hud text-[#FF5357] bg-[#FF5357]/10 px-1.5 py-0.5 rounded border border-[#FF5357]/30">
                          {row.other_user.profile?.blood_type || 'O-'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6C757D] dark:text-[#919095] truncate mt-0.5">{row.latest_message || 'Tap to start conversing'}</p>
                    </div>
                    {row.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#FF0033] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {row.unread_count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Active Conversation Area */}
        <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#F8F9FA] dark:bg-[#131314]`}>
          {activeChat ? (
            <>
              {/* Active Header */}
              <div className="p-4 border-b border-[#DEE2E6] dark:border-[#2A2A2B] bg-white/80 dark:bg-[#0E0E0F]/80 backdrop-blur-md flex items-center gap-3">
                <button
                  onClick={() => setActiveChat(null)}
                  className="md:hidden p-2 rounded-xl text-[#FF5357] hover:bg-[#DEE2E6] dark:hover:bg-[#2A2A2B] transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-9 h-9 rounded-xl bg-[#DEE2E6] dark:bg-[#2A2A2B] border border-[#FF5357]/40 flex items-center justify-center font-bold text-xs text-[#FF5357] uppercase">
                  {activeChat.other_user.username.substring(0, 2)}
                </div>

                <div>
                  <h3 className="font-bold text-base text-[#1A1A1A] dark:text-[#E5E2E3] flex items-center gap-2">
                    <span>{activeChat.other_user.username}</span>
                    <span className="text-[10px] font-mono-hud text-[#00A86B] dark:text-[#00FF94] bg-[#00FF94]/15 px-2 py-0.5 rounded-full border border-[#00FF94]/30">
                      {activeChat.other_user.profile?.blood_type || 'O-'}
                    </span>
                  </h3>
                  <p className="text-[10px] font-mono-hud text-[#6C757D] dark:text-[#919095]">WEBSOCKET REAL-TIME ENCRYPTED CHANNEL</p>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-[#6C757D] dark:text-[#919095] text-xs">
                    <p>No messages yet. Send a message to start conversing!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] ${
                          isMine ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div
                          className={`p-3.5 rounded-2xl text-sm font-sans ${
                            isMine
                              ? 'bg-gradient-to-r from-[#FF0033] to-[#FF5357] text-white rounded-br-none shadow-[0_0_15px_rgba(255,0,51,0.2)]'
                              : 'bg-white dark:bg-[#1C1B1C] border border-[#DEE2E6] dark:border-[#2A2A2B] text-[#1A1A1A] dark:text-[#E5E2E3] rounded-bl-none shadow-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[9px] font-mono-hud text-[#6C757D] dark:text-[#919095] mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-[#DEE2E6] dark:border-[#2A2A2B] bg-white/80 dark:bg-[#0E0E0F]/80 backdrop-blur-md flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 bg-[#F1F3F5] dark:bg-[#1C1B1C] border border-[#DEE2E6] dark:border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-xl py-3 px-4 text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E2E3] placeholder-[#6C757D]/60 dark:placeholder-[#919095]/60 transition"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] disabled:opacity-50 text-white p-3 rounded-xl transition shadow-[0_0_15px_rgba(255,0,51,0.3)] cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
              <div className="w-16 h-16 rounded-3xl bg-[#DEE2E6] dark:bg-[#1C1B1C] border border-[#FF5357]/30 flex items-center justify-center text-[#FF5357]">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-headline font-bold text-lg text-[#1A1A1A] dark:text-[#E5E2E3]">No Conversation Selected</h3>
              <p className="text-xs font-mono-hud text-[#6C757D] dark:text-[#919095] max-w-sm">
                Select an existing chat from the left panel or click "Chat Now" on any compatible donor in the Donors Directory.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#131314] flex items-center justify-center text-[#6C757D] dark:text-[#919095] font-mono-hud text-xs">
        LOADING CHAT MATRIX...
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
