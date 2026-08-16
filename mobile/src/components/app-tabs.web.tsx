import React, { useEffect, useState } from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addAuthListener, getCurrentUser } from '@/utils/api';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  const [user, setUser] = useState<any>(getCurrentUser());

  useEffect(() => {
    const unsubscribe = addAuthListener((t, u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  const isAdmin = user && user.role === 'admin';

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="book" href="/book" asChild>
            <TabButton>Book</TabButton>
          </TabTrigger>
          <TabTrigger name="requests" href={"/requests" as any} asChild>
            <TabButton>SOS</TabButton>
          </TabTrigger>
          <TabTrigger name="rewards" href={"/rewards" as any} asChild>
            <TabButton>Rewards</TabButton>
          </TabTrigger>
          <TabTrigger name="chat" href="/chat" asChild>
            <TabButton>Chat</TabButton>
          </TabTrigger>
          <TabTrigger name="users" href={"/users" as any} asChild>
            <TabButton>Donors</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Profile</TabButton>
          </TabTrigger>
          {isAdmin && (
            <TabTrigger name="admin" href={"/admin" as any} asChild>
              <TabButton>Admin</TabButton>
            </TabTrigger>
          )}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={[
          styles.tabButtonView,
          isFocused && { backgroundColor: '#FF0033', borderColor: '#FF5357' }
        ]}>
        <ThemedText 
          type="small" 
          style={{
            color: isFocused ? '#ffffff' : '#919095',
            fontWeight: isFocused ? 'bold' : '600',
            fontSize: 11,
          }}
        >
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View {...props} style={styles.tabListContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollInnerContainer}
        style={{ width: '100%' }}
      >
        <ThemedView type="backgroundElement" style={styles.innerContainer}>
          {props.children}
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 19, 20, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2B',
    zIndex: 100,
  },
  scrollInnerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1C1B1C',
    borderWidth: 1,
    borderColor: '#2A2A2B',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
