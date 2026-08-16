'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { chatApi, ChatRow, Message, getWebSocketUrl, User, getCurrentUser } from '@/lib/api';
import { MessageSquare, Send, Activity, User as UserIcon, Heart } from 'lucide-react';

function ChatContent() {
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
      window.dispatchEvent(new Event('chatUpdate'));
      
      // Reset the unread count in local chats state array
      setChats(prevChats => prevChats.map(c => 
        c.other_user.id === otherId ? { ...c, unread_count: 0 } : c
      ));
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
        chatApi.markRead(activeChat.other_user.id)
          .then(() => window.dispatchEvent(new Event('chatUpdate')))
          .catch(console.error);

        // Also update the latest message and clear unread count for this active chat in the sidebar list!
        setChats(prevChats => prevChats.map(c => 
          c.other_user.id === activeChat.other_user.id 
            ? { ...c, latest_message: newMsg.content, unread_count: 0, timestamp: newMsg.created_at } 
            : c
        ));
      } else {
        // Increment unread count or reload chat lists
        loadChats();
        window.dispatchEvent(new Event('chatUpdate'));
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA] dark:bg-[#131314] text-[#1A1A1A] dark:text-[#E5E2E3] h-screen overflow-hidden selection:bg-[#FF0033] selection:text-white">
      <Navigation />

      <main className="flex-1 flex overflow-hidden border-t lg:border-t-0 border-[#2A2A2B]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Activity className="w-10 h-10 text-[#FF5357] animate-spin" />
            <span className="text-[#919095] font-mono-hud text-xs">TUNING BLOOD HERO CHANNELS...</span>
          </div>
        ) : (
          <div className="flex-1 flex h-full overflow-hidden">
            {/* Left Sidebar - Chat list */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-[#2A2A2B] flex flex-col bg-[#0E0E0F] h-full ${
              activeChat ? 'hidden md:flex' : 'flex'
            }`}>
              <div className="p-6 border-b border-[#2A2A2B]">
                <h3 className="font-headline font-bold text-[#E5E2E3] text-base flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#FF5357]" />
                  <span>ACTIVE CONVERSATIONS</span>
                </h3>
                <span className="text-[10px] font-mono-hud text-[#00F1FE] uppercase">ENCRYPTED WEBSOCKET MESH</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {chats.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                    <MessageSquare className="w-10 h-10 text-[#2A2A2B]" />
                    <span className="font-headline font-bold text-xs text-[#919095]">No Chats Started</span>
                    <button 
                      onClick={() => router.push('/users')}
                      className="text-xs font-mono-hud text-[#FF5357] font-bold hover:underline uppercase"
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
                            ? 'bg-[#FF0033]/20 border-[#FF0033]/40 text-[#FF5357] shadow-[0_0_15px_rgba(255,0,51,0.2)]' 
                            : 'bg-[#1C1B1C]/60 border-[#2A2A2B] hover:border-[#FF5357]/30'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#2A2A2B] border border-[#FF5357]/40 flex items-center justify-center font-headline font-bold text-[#FF5357] uppercase text-xs">
                          {row.other_user.username.substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-headline font-bold text-[#E5E2E3] text-sm truncate">{row.other_user.username}</span>
                            <span className="text-[10px] font-mono-hud text-[#919095] shrink-0">
                              {row.timestamp ? new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-xs font-sans text-[#919095] mt-1 truncate">{row.latest_message || 'Start chatting...'}</p>
                        </div>
                        {row.unread_count > 0 && (
                          <span className="bg-[#FF0033] text-white text-[10px] font-mono-hud font-extrabold w-5 h-5 rounded-full flex items-center justify-center self-center shrink-0 shadow-[0_0_10px_rgba(255,0,51,0.6)]">
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
            <div className={`flex-1 flex flex-col h-full bg-[#131314] ${
              activeChat ? 'flex' : 'hidden md:flex items-center justify-center'
            }`}>
              {activeChat ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Active Header */}
                  <div className="p-4 border-b border-[#2A2A2B] flex justify-between items-center bg-[#0E0E0F]">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveChat(null)} 
                        className="md:hidden text-[#919095] hover:text-[#E5E2E3] mr-2 text-xs font-mono-hud font-bold"
                      >
                        ← BACK
                      </button>
                      <div className="w-10 h-10 rounded-xl bg-[#2A2A2B] border border-[#FF5357]/40 flex items-center justify-center font-headline font-bold text-[#FF5357] uppercase text-sm">
                        {activeChat.other_user.username.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-[#E5E2E3] text-sm">{activeChat.other_user.username}</h4>
                        <p className="text-[10px] font-mono-hud text-[#00F1FE] font-bold mt-0.5">BLOOD TYPE: {activeChat.other_user.profile?.blood_type || 'A+'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                    {messages.length === 0 ? (
                      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                        <MessageSquare className="w-10 h-10 text-[#2A2A2B]" />
                        <span className="text-xs font-mono-hud text-[#919095]">No message history. Send a message to start conversation.</span>
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
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                              isMine 
                                ? 'bg-gradient-to-r from-[#FF0033] to-[#FF5357] text-white rounded-br-none shadow-[0_0_15px_rgba(255,0,51,0.25)]' 
                                : 'bg-[#1C1B1C] text-[#E5E2E3] rounded-bl-none border border-[#2A2A2B]'
                            }`}>
                              {msg.content}
                            </div>
                            <span className="text-[9px] font-mono-hud text-[#919095] mt-1 px-1.5">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Box */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-[#2A2A2B] bg-[#0E0E0F]">
                    <div className="relative flex gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Write your message..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="flex-1 bg-[#131314] border border-[#2A2A2B] focus:border-[#FF5357] focus:ring-1 focus:ring-[#FF5357] rounded-2xl py-3 px-5 text-sm font-semibold text-[#E5E2E3] placeholder-[#919095]/60 outline-none transition"
                      />
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-[#FF0033] to-[#FF5357] hover:from-[#FF5357] hover:to-[#FF0033] text-white p-3.5 rounded-2xl shadow-[0_0_20px_rgba(255,0,51,0.4)] transition duration-150 transform hover:scale-[1.03] active:scale-[0.97]"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3.5 text-center px-6">
                  <div className="bg-[#1C1B1C] border border-[#2A2A2B] p-5.5 rounded-2xl text-[#FF5357]">
                    <MessageSquare className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-[#E5E2E3] text-base">Select a Conversation</h3>
                    <p className="text-xs font-mono-hud text-[#919095] max-w-xs mt-1.5 leading-normal">
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

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-[#131314] text-[#E5E2E3] justify-center items-center gap-4">
        <Activity className="w-10 h-10 text-[#FF5357] animate-spin" />
        <span className="text-[#919095] font-mono-hud text-xs">TUNING BLOOD HERO CHANNELS...</span>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
