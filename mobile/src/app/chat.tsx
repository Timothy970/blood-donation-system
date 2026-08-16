import React, { useEffect, useState, useRef, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemeContext } from '@/context/theme-context';
import { mobileApi, ChatRow, Message, getWebSocketUrl, getCurrentUser } from '@/utils/api';

export default function ChatScreen() {
  const theme = useTheme();
  const { colorScheme, toggleColorScheme } = useContext(ThemeContext);
  const params = useLocalSearchParams();
  const otherIdParam = params.other_id;

  const [chats, setChats] = useState<ChatRow[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRow | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);

  // Load chat listing
  const loadChats = async (selectOtherId?: number) => {
    try {
      const data = await mobileApi.chats.list();
      setChats(data || []);
      
      if (selectOtherId) {
        const active = data?.find(c => c.other_user.id === selectOtherId);
        if (active) {
          setActiveChat(active);
          loadMessages(selectOtherId);
        } else {
          // Stub a chat row using users list
          const users = await mobileApi.chats.users();
          const target = users?.find((u: any) => u.id === selectOtherId);
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
      console.log('Failed to load chats on mobile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherId: number) => {
    try {
      const data = await mobileApi.chats.messages(otherId);
      setMessages(data || []);
      await mobileApi.chats.markRead(otherId);
    } catch (err) {
      console.log('Failed to load chat messages on mobile:', err);
    }
  };

  // Run on start and when incoming parameter matches
  useEffect(() => {
    const selectId = otherIdParam ? Number(otherIdParam) : undefined;
    loadChats(selectId);
  }, [otherIdParam]);

  // WebSocket Live Connection
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !activeChat) return;

    const wsUrl = getWebSocketUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Mobile WS connected to Chat Hub.');
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

      // Append if matches active conversation
      if (
        (newMsg.sender_id === user.id && newMsg.receiver_id === activeChat.other_user.id) ||
        (newMsg.sender_id === activeChat.other_user.id && newMsg.receiver_id === user.id)
      ) {
        setMessages((prev) => [...prev, newMsg]);
        mobileApi.chats.markRead(activeChat.other_user.id).catch(console.error);
        
        // Update list sidebar info locally
        setChats(prevChats => prevChats.map(c => 
          c.other_user.id === activeChat.other_user.id 
            ? { ...c, latest_message: newMsg.content, unread_count: 0, timestamp: newMsg.created_at } 
            : c
        ));
      } else {
        loadChats();
      }
    };

    ws.onclose = () => {
      console.log('Mobile WS disconnected.');
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

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeChat || !wsRef.current) return;

    const payload = {
      receiver_id: activeChat.other_user.id,
      content: inputMessage.trim(),
    };

    wsRef.current.send(JSON.stringify(payload));
    setInputMessage('');
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Standardized Header with Theme Toggle */}
        <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusDot, { backgroundColor: theme.bioGreen }]} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>Encrypted Live Chat</Text>
            </View>
            <TouchableOpacity onPress={toggleColorScheme} style={[styles.themeToggleBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={{ fontSize: 16 }}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.secondary }]}>REAL-TIME WEBSOCKET ENCRYPTED CHAT CHANNEL</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginVertical: 40 }} />
        ) : activeChat ? (
          /* Active Chat Room Overlay */
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={[styles.activeHeader, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.backgroundSelected }]}>
              <TouchableOpacity onPress={() => setActiveChat(null)} style={styles.backButton}>
                <Text style={{ color: theme.primary, fontWeight: 'bold' }}>← Back</Text>
              </TouchableOpacity>
              <Text style={[styles.activeTitle, { color: theme.text }]}>{activeChat.other_user.username}</Text>
              <View style={[styles.bloodBadge, { backgroundColor: theme.backgroundSelected }]}>
                <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>
                  {activeChat.other_user.profile?.blood_type || 'A+'}
                </Text>
              </View>
            </View>

            {/* Messages List */}
            <ScrollView 
              style={styles.messagesList}
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.length === 0 ? (
                <Text style={[styles.emptyChatText, { color: theme.textSecondary }]}>
                  No messages yet. Send a message to start conversing!
                </Text>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === getCurrentUser()?.id;
                  return (
                    <View 
                      key={msg.id} 
                      style={[
                        styles.msgRow, 
                        isMine ? styles.myMsgRow : styles.otherMsgRow
                      ]}
                    >
                      <View 
                        style={[
                          styles.msgBubble, 
                          isMine 
                            ? { backgroundColor: theme.primaryNeon, borderBottomRightRadius: 2 } 
                            : { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected, borderWidth: 1, borderBottomLeftRadius: 2 }
                        ]}
                      >
                        <Text style={{ color: isMine ? '#ffffff' : theme.text, fontSize: 13 }}>
                          {msg.content}
                        </Text>
                        <Text style={{ color: isMine ? 'rgba(255, 255, 255, 0.7)' : theme.textSecondary, fontSize: 9, marginTop: 4, textAlign: 'right' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Input Bar */}
            <View style={[styles.inputBar, { backgroundColor: theme.backgroundElement, borderTopColor: theme.backgroundSelected }]}>
              <TextInput
                style={[styles.msgInput, { color: theme.text, backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}
                placeholder="Type a message..."
                placeholderTextColor={theme.textSecondary}
                value={inputMessage}
                onChangeText={setInputMessage}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.primaryNeon }]} onPress={handleSendMessage}>
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>Send</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : (
          /* Chat List Sidebar */
          <ScrollView style={styles.chatListScroll}>
            {chats.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>No Active Conversations</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                  Browse the Donors Directory to initiate direct messaging.
                </Text>
              </View>
            ) : (
              chats.map((row) => (
                <TouchableOpacity
                  key={row.chat_id || row.other_user.id}
                  style={[styles.chatRowItem, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
                  onPress={() => handleSelectChat(row)}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.otherUsername, { color: theme.text }]}>{row.other_user.username}</Text>
                      <View style={[styles.bloodPill, { backgroundColor: theme.backgroundSelected }]}>
                        <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 10 }}>
                          {row.other_user.profile?.blood_type || 'A+'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.latestMsg, { color: theme.textSecondary }]} numberOfLines={1}>
                      {row.latest_message || 'Tap to view conversation'}
                    </Text>
                  </View>

                  {row.unread_count > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: theme.primaryNeon }]}>
                      <Text style={styles.unreadText}>{row.unread_count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  themeToggleBtn: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 1.2,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  activeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  bloodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
  },
  emptyChatText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 12,
    fontStyle: 'italic',
  },
  msgRow: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  myMsgRow: {
    justifyContent: 'flex-end',
  },
  otherMsgRow: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '80%',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
    alignItems: 'center',
  },
  msgInput: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  sendBtn: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chatListScroll: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  emptyBox: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
  },
  chatRowItem: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  otherUsername: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bloodPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  latestMsg: {
    fontSize: 11,
    marginTop: 4,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
