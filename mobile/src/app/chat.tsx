import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { mobileApi, ChatRow, Message, getWebSocketUrl, getCurrentUser } from '@/utils/api';

export default function ChatScreen() {
  const theme = useTheme();
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
      setChats(data);
      
      if (selectOtherId) {
        const active = data.find(c => c.other_user.id === selectOtherId);
        if (active) {
          setActiveChat(active);
          loadMessages(selectOtherId);
        } else {
          // Stub a chat row using users list
          const users = await mobileApi.chats.users();
          const target = users.find((u: any) => u.id === selectOtherId);
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
      setMessages(data);
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
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Conversations</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Coordinate donations in real-time</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#dc2626" style={{ marginVertical: 40 }} />
        ) : activeChat ? (
          /* Active Chat overlay / room */
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={[styles.activeHeader, { borderBottomColor: theme.backgroundSelected }]}>
              <TouchableOpacity onPress={() => setActiveChat(null)} style={styles.backButton}>
                <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>← Back</Text>
              </TouchableOpacity>
              <Text style={[styles.activeTitle, { color: theme.text }]}>{activeChat.other_user.username}</Text>
              <View style={[styles.bloodBadge, { backgroundColor: theme.backgroundSelected }]}>
                <Text style={[styles.bloodText, { color: '#dc2626' }]}>
                  {activeChat.other_user.profile?.blood_type || 'O-'}
                </Text>
              </View>
            </View>

            {/* Messages scrolling list */}
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
                            ? { backgroundColor: '#dc2626' } 
                            : { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.backgroundSelected }
                        ]}
                      >
                        <Text style={{ color: isMine ? '#ffffff' : theme.text, fontSize: 13 }}>
                          {msg.content}
                        </Text>
                      </View>
                      <Text style={[styles.msgTime, { color: theme.textSecondary }]}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Input bar */}
            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundElement, borderTopColor: theme.backgroundSelected }]}>
              <TextInput
                style={[styles.textInput, { color: theme.text, backgroundColor: theme.background }]}
                placeholder="Type message..."
                placeholderTextColor={theme.textSecondary}
                value={inputMessage}
                onChangeText={setInputMessage}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : (
          /* List of chats */
          <ScrollView style={styles.chatsList}>
            {chats.length === 0 ? (
              <View style={styles.emptyChatsBox}>
                <Text style={[styles.emptyChatsText, { color: theme.textSecondary }]}>No active chats found.</Text>
              </View>
            ) : (
              chats.map((row) => (
                <TouchableOpacity
                  key={row.other_user.id}
                  style={[styles.chatRow, { borderBottomColor: theme.backgroundSelected }]}
                  onPress={() => handleSelectChat(row)}
                >
                  <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
                    <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                      {row.other_user.username.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[styles.rowTitle, { color: theme.text }]}>{row.other_user.username}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 10 }}>
                        {row.timestamp ? new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </Text>
                    </View>
                    <Text style={[styles.rowMessage, { color: theme.textSecondary }]} numberOfLines={1}>
                      {row.latest_message || 'Start chatting...'}
                    </Text>
                  </View>
                  
                  {row.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{row.unread_count}</Text>
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
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  chatsList: {
    flex: 1,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  rowMessage: {
    fontSize: 12,
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  emptyChatsBox: {
    padding: 64,
    alignItems: 'center',
  },
  emptyChatsText: {
    fontSize: 12,
  },
  // Active Chat Styles
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingRight: 16,
  },
  activeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  bloodBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bloodText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  messagesList: {
    flex: 1,
    padding: Spacing.three,
  },
  emptyChatText: {
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 40,
  },
  msgRow: {
    marginBottom: Spacing.two,
    maxWidth: '80%',
  },
  myMsgRow: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMsgRow: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  msgBubble: {
    borderRadius: 16,
    padding: 12,
  },
  msgTime: {
    fontSize: 9,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.two,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
  },
  sendButton: {
    backgroundColor: '#dc2626',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
