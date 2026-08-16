import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemeContext } from '@/context/theme-context';
import { mobileApi, User } from '@/utils/api';

export default function UsersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useContext(ThemeContext);

  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodFilter, setBloodFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mobileApi.users.list()
      .then(res => setUsers(res || []))
      .catch(err => console.log('Failed to fetch donors list on mobile:', err))
      .finally(() => setLoading(false));
  }, []);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const filteredUsers = users.filter(u => {
    const nameMatch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (u.profile?.city || '').toLowerCase().includes(searchQuery.toLowerCase());
    const bloodMatch = bloodFilter ? u.profile?.blood_type === bloodFilter : true;
    return nameMatch && bloodMatch;
  });

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusDot, { backgroundColor: theme.bioGreen }]} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>Find Donors Directory</Text>
            </View>
            <TouchableOpacity onPress={toggleColorScheme} style={[styles.themeToggleBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={{ fontSize: 16 }}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.secondary }]}>SEARCH REGISTERED DONOR HEROES & INITIATE SECURE CHAT</Text>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.filterSection}>
          <TextInput
            style={[styles.searchInput, { color: theme.text, backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}
            placeholder="Search by username or city..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bloodFilterScroll}>
            <TouchableOpacity
              style={[
                styles.bloodFilterPill,
                { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected },
                !bloodFilter && { backgroundColor: theme.primaryNeon, borderColor: theme.primary }
              ]}
              onPress={() => setBloodFilter('')}
            >
              <Text style={[styles.bloodFilterText, { color: !bloodFilter ? '#ffffff' : theme.textSecondary }]}>All</Text>
            </TouchableOpacity>
            {bloodTypes.map(type => {
              const isSelected = bloodFilter === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.bloodFilterPill,
                    { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected },
                    isSelected && { backgroundColor: theme.primaryNeon, borderColor: theme.primary }
                  ]}
                  onPress={() => setBloodFilter(isSelected ? '' : type)}
                >
                  <Text style={[styles.bloodFilterText, { color: isSelected ? '#ffffff' : theme.textSecondary }]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} size="large" style={{ marginVertical: 40 }} />
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {filteredUsers.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Donors Found</Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Try refining your search terms or blood group filter.</Text>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                {filteredUsers.map((item) => (
                  <View key={item.id} style={[styles.donorCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.donorName, { color: theme.text }]}>{item.username}</Text>
                        <Text style={[styles.donorCity, { color: theme.secondary }]}>📍 {item.profile?.city || 'Nairobi'}</Text>
                        <Text style={[styles.donorAvail, { color: theme.textSecondary }]}>Availability: {item.profile?.availability || 'Anyday'}</Text>
                      </View>
                      <View style={[styles.bloodBadge, { backgroundColor: 'rgba(255, 0, 51, 0.15)', borderColor: 'rgba(255, 0, 51, 0.3)' }]}>
                        <Text style={[styles.bloodBadgeText, { color: theme.primary }]}>{item.profile?.blood_type || 'A+'}</Text>
                      </View>
                    </View>

                    <View style={[styles.cardActions, { borderTopColor: theme.backgroundSelected }]}>
                      <TouchableOpacity
                        style={[styles.chatBtn, { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}
                        onPress={() => router.push(`/chat?other_id=${item.id}` as any)}
                      >
                        <Text style={[styles.chatBtnText, { color: theme.text }]}>💬 Chat</Text>
                      </TouchableOpacity>

                      {item.profile?.phone_number ? (
                        <TouchableOpacity
                          style={[styles.whatsappBtn, { backgroundColor: 'rgba(0, 255, 148, 0.15)', borderColor: 'rgba(0, 255, 148, 0.3)' }]}
                          onPress={() => {
                            const phone = (item.profile?.phone_number || '').replace(/[^\d]/g, '');
                            Linking.openURL(`https://wa.me/${phone}?text=Hello%20${item.username},%20we%20found%20your%20profile%20on%20BloodHero.`);
                          }}
                        >
                          <Text style={[styles.whatsappBtnText, { color: theme.bioGreen }]}>📞 WhatsApp</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
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
  filterSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: 10,
  },
  searchInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  bloodFilterScroll: {
    flexDirection: 'row',
  },
  bloodFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
  },
  bloodFilterText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BottomTabInset + 60,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: 14,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptySub: {
    fontSize: 11,
    marginTop: 4,
  },
  donorCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  donorName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  donorCity: {
    fontSize: 11,
    marginTop: 2,
  },
  donorAvail: {
    fontSize: 10,
    marginTop: 2,
  },
  bloodBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bloodBadgeText: {
    fontWeight: '900',
    fontSize: 14,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  chatBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chatBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  whatsappBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  whatsappBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
