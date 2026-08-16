import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemeContext } from '@/context/theme-context';
import { mobileApi, AdminStats, Booking, BloodRequest } from '@/utils/api';

export default function AdminScreen() {
  const theme = useTheme();
  const { colorScheme, toggleColorScheme } = useContext(ThemeContext);

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'alerts' | 'users'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const loadAdminData = async () => {
    setErrorMsg('');
    try {
      const [statsData, bookingsData, requestsData, usersData] = await Promise.all([
        mobileApi.admin.getStats(),
        mobileApi.admin.listBookings(),
        mobileApi.admin.listRequests(),
        mobileApi.admin.listUsers(),
      ]);
      setStats(statsData);
      setBookings(bookingsData || []);
      setRequests(requestsData || []);
      setUsers(usersData || []);
    } catch (err: any) {
      console.log('Failed to fetch admin dashboard records:', err);
      setErrorMsg(err.message || 'Failed to query administration services.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateBooking = async (id: number, status: string) => {
    setRefreshing(true);
    try {
      await mobileApi.admin.updateBooking(id, status);
      await loadAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update booking status.');
      setRefreshing(false);
    }
  };

  const handleDeleteRequest = (id: number) => {
    Alert.alert(
      'Resolve SOS Request',
      'Are you sure you want to resolve and delete this SOS request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          style: 'destructive',
          onPress: async () => {
            setRefreshing(true);
            try {
              await mobileApi.admin.deleteRequest(id);
              await loadAdminData();
            } catch (err: any) {
              setErrorMsg(err.message || 'Failed to delete SOS alert.');
              setRefreshing(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = (id: number, username: string) => {
    Alert.alert(
      'Caution: Delete Account',
      `Are you sure you want to permanently delete user "${username}"? This deletes all profiles, logs, and booking contexts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setRefreshing(true);
            try {
              await mobileApi.admin.deleteUser(id);
              await loadAdminData();
            } catch (err: any) {
              setErrorMsg(err.message || 'Failed to delete user.');
              setRefreshing(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Standardized Header with Theme Toggle */}
        <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>Admin Console</Text>
            </View>
            <TouchableOpacity onPress={toggleColorScheme} style={[styles.themeToggleBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={{ fontSize: 16 }}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.secondary }]}>GLOBAL OVERSIGHT OF MATCHES, SCHEDULED SLOTS & USER REGISTRIES</Text>
        </View>

        {/* Custom Segmented Tabs */}
        <View style={[styles.tabBar, { borderBottomColor: theme.backgroundSelected }]}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'overview' && { borderBottomColor: theme.primaryNeon }]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabLabel, { color: activeTab === 'overview' ? theme.primary : theme.textSecondary }]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'bookings' && { borderBottomColor: theme.primaryNeon }]}
            onPress={() => setActiveTab('bookings')}
          >
            <Text style={[styles.tabLabel, { color: activeTab === 'bookings' ? theme.primary : theme.textSecondary }]}>
              Bookings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'alerts' && { borderBottomColor: theme.primaryNeon }]}
            onPress={() => setActiveTab('alerts')}
          >
            <Text style={[styles.tabLabel, { color: activeTab === 'alerts' ? theme.primary : theme.textSecondary }]}>
              SOS Alerts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'users' && { borderBottomColor: theme.primaryNeon }]}
            onPress={() => setActiveTab('users')}
          >
            <Text style={[styles.tabLabel, { color: activeTab === 'users' ? theme.primary : theme.textSecondary }]}>
              Users
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 40 }} />
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {errorMsg}</Text>
              </View>
            ) : null}

            {activeTab === 'overview' && (
              <View style={{ gap: Spacing.four }}>
                {/* Stats 2x2 Grid */}
                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>MEMBERS</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats?.total_users || 0}</Text>
                  </View>

                  <View style={[styles.statCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>DONATIONS</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats?.total_donations || 0}</Text>
                  </View>

                  <View style={[styles.statCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>VOLUME (ML)</Text>
                    <Text style={[styles.statValue, { color: theme.bioGreen }]}>{stats?.total_donation_volume_ml || 0} ml</Text>
                  </View>

                  <View style={[styles.statCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>ACTIVE SOS</Text>
                    <Text style={[styles.statValue, { color: theme.secondary }]}>{stats?.total_active_requests || 0}</Text>
                  </View>
                </View>

                {/* Operations Checklist */}
                <View style={[styles.checklistCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>📋 Administrative Operations Checklist</Text>
                  <Text style={[styles.checkText, { color: theme.textSecondary }]}>
                    • <Text style={{ color: theme.text, fontWeight: 'bold' }}>Bookings:</Text> Verify intake completions and issue matching XP rewards.
                  </Text>
                  <Text style={[styles.checkText, { color: theme.textSecondary }]}>
                    • <Text style={{ color: theme.text, fontWeight: 'bold' }}>SOS Alerts:</Text> Clear emergency broadcasts that have been fulfilled.
                  </Text>
                  <Text style={[styles.checkText, { color: theme.textSecondary }]}>
                    • <Text style={{ color: theme.text, fontWeight: 'bold' }}>Users:</Text> Audit member records and manage clinic permissions.
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'bookings' && (
              <View style={{ gap: Spacing.three }}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>APPOINTMENT BOOKINGS MANAGEMENT</Text>
                {bookings.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>No user bookings recorded.</Text>
                  </View>
                ) : (
                  bookings.map((b) => (
                    <View key={b.id} style={[styles.itemCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.itemTitle, { color: theme.text }]}>{b.first_name} {b.last_name}</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>📍 {b.location}</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>📅 {new Date(b.date).toLocaleDateString()} at {b.time_slot}</Text>
                      </View>
                      <View style={{ gap: 6, alignItems: 'flex-end' }}>
                        <View style={[styles.statusBadge, { backgroundColor: theme.backgroundSelected }]}>
                          <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 10 }}>{b.status}</Text>
                        </View>
                        {b.status === 'Pending' && (
                          <TouchableOpacity
                            style={[styles.verifyBtn, { backgroundColor: 'rgba(0, 255, 148, 0.15)', borderColor: 'rgba(0, 255, 148, 0.4)' }]}
                            onPress={() => handleUpdateBooking(b.id, 'Completed')}
                          >
                            <Text style={{ color: theme.bioGreen, fontWeight: 'bold', fontSize: 10 }}>✓ Verify Complete</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === 'alerts' && (
              <View style={{ gap: Spacing.three }}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>EMERGENCY SOS BROADCASTS</Text>
                {requests.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>No emergency SOS alerts active.</Text>
                  </View>
                ) : (
                  requests.map((r) => (
                    <View key={r.id} style={[styles.itemCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.itemTitle, { color: theme.text }]}>{r.first_name} {r.last_name}</Text>
                        <Text style={{ color: theme.secondary, fontSize: 11 }}>📍 {r.location}</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>📞 {r.contact_number}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.resolveBtn, { backgroundColor: 'rgba(255, 0, 51, 0.15)', borderColor: 'rgba(255, 0, 51, 0.4)' }]}
                        onPress={() => handleDeleteRequest(r.id)}
                      >
                        <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 10 }}>Resolve SOS</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === 'users' && (
              <View style={{ gap: Spacing.three }}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>REGISTERED MEMBER DIRECTORY</Text>
                {users.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>No registered members found.</Text>
                  </View>
                ) : (
                  users.map((u) => (
                    <View key={u.id} style={[styles.itemCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.itemTitle, { color: theme.text }]}>{u.username}</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>✉ {u.email}</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Blood Group: {u.profile?.blood_type || 'A+'}</Text>
                      </View>
                      {u.role !== 'admin' && (
                        <TouchableOpacity
                          style={[styles.resolveBtn, { backgroundColor: 'rgba(255, 0, 51, 0.15)', borderColor: 'rgba(255, 0, 51, 0.4)' }]}
                          onPress={() => handleDeleteUser(u.id, u.username)}
                        >
                          <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 10 }}>Purge User</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BottomTabInset + 60,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 0, 51, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 51, 0.3)',
    borderRadius: 14,
    padding: 12,
  },
  errorText: {
    color: '#FF5357',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  checklistCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  checkText: {
    fontSize: 12,
    lineHeight: 18,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  itemCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  resolveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
});
