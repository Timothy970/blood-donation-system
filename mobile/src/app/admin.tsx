import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { mobileApi, AdminStats, Booking, BloodRequest } from '@/utils/api';

export default function AdminScreen() {
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'alerts'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const loadAdminData = async () => {
    setErrorMsg('');
    try {
      const [statsData, bookingsData, requestsData] = await Promise.all([
        mobileApi.admin.getStats(),
        mobileApi.admin.listBookings(),
        mobileApi.admin.listRequests(),
      ]);
      setStats(statsData);
      setBookings(bookingsData);
      setRequests(requestsData);
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

  const handleDeleteRequest = async (id: number) => {
    setRefreshing(true);
    try {
      await mobileApi.admin.deleteRequest(id);
      await loadAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete SOS alert.');
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Admin Console</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Oversee medical bookings and active emergency SOS coordinates</Text>
        </View>

        {/* Custom Segmented Tabs */}
        <View style={[styles.tabBar, { borderBottomColor: theme.backgroundSelected }]}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'overview' && { borderBottomColor: '#dc2626' }]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabLabel, { color: activeTab === 'overview' ? '#ef4444' : theme.textSecondary }]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'bookings' && { borderBottomColor: '#dc2626' }]}
            onPress={() => setActiveTab('bookings')}
          >
            <Text style={[styles.tabLabel, { color: activeTab === 'bookings' ? '#ef4444' : theme.textSecondary }]}>
              Bookings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'alerts' && { borderBottomColor: '#dc2626' }]}
            onPress={() => setActiveTab('alerts')}
          >
            <Text style={[styles.tabLabel, { color: activeTab === 'alerts' ? '#ef4444' : theme.textSecondary }]}>
              SOS Alerts
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#dc2626" style={{ marginVertical: 40 }} />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {errorMsg}</Text>
              </View>
            ) : null}

            {refreshing && (
              <ActivityIndicator color="#dc2626" style={{ marginVertical: 10 }} />
            )}

            {/* OVERVIEW SUB-VIEW */}
            {activeTab === 'overview' && stats && (
              <View style={styles.tabContent}>
                <View style={[styles.statCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{stats.total_users}</Text>
                  <Text style={[styles.statLabelText, { color: theme.textSecondary }]}>Registered Members</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{stats.total_donations}</Text>
                  <Text style={[styles.statLabelText, { color: theme.textSecondary }]}>Completed Donations</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{(stats.total_donation_volume_ml / 1000).toFixed(1)}L</Text>
                  <Text style={[styles.statLabelText, { color: theme.textSecondary }]}>Volume Collected</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                  <Text style={[styles.statValue, { color: '#eab308' }]}>{stats.total_active_bookings}</Text>
                  <Text style={[styles.statLabelText, { color: theme.textSecondary }]}>Pending Bookings</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                  <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.total_active_requests}</Text>
                  <Text style={[styles.statLabelText, { color: theme.textSecondary }]}>Emergency SOS Requests</Text>
                </View>
              </View>
            )}

            {/* BOOKINGS SUB-VIEW */}
            {activeTab === 'bookings' && (
              <View style={styles.tabContent}>
                <Text style={[styles.sectionHeading, { color: theme.text }]}>All Clinical Appointments</Text>
                {bookings.length === 0 ? (
                  <Text style={{ color: theme.textSecondary, fontStyle: 'italic', marginVertical: 20 }}>
                    No bookings found in the system.
                  </Text>
                ) : (
                  bookings.map((booking) => (
                    <View
                      key={booking.id}
                      style={[styles.bookingCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
                    >
                      <View style={styles.bookingCardHeader}>
                        <Text style={[styles.bookingName, { color: theme.text }]}>
                          {booking.first_name} {booking.last_name}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          booking.status === 'Completed' && { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
                          booking.status === 'Cancelled' && { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                          booking.status === 'Pending' && { backgroundColor: 'rgba(234, 179, 8, 0.15)' },
                        ]}>
                          <Text style={[
                            styles.statusText,
                            booking.status === 'Completed' && { color: '#34d399' },
                            booking.status === 'Cancelled' && { color: '#ef4444' },
                            booking.status === 'Pending' && { color: '#eab308' },
                          ]}>
                            {booking.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.bookingDetails}>
                        <Text style={[styles.detailsText, { color: theme.textSecondary }]}>
                          📅 {new Date(booking.date).toLocaleDateString()} | ⏰ {booking.time_slot}
                        </Text>
                        <Text style={[styles.detailsText, { color: theme.textSecondary }]}>
                          📍 {booking.location}
                        </Text>
                      </View>

                      {booking.status === 'Pending' && (
                        <View style={styles.bookingActions}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.completeBtn]}
                            onPress={() => handleUpdateBooking(booking.id, 'Completed')}
                          >
                            <Text style={styles.actionBtnText}>✓ Complete</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionBtn, styles.cancelBtn]}
                            onPress={() => handleUpdateBooking(booking.id, 'Cancelled')}
                          >
                            <Text style={styles.actionBtnText}>✕ Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* SOS ALERTS SUB-VIEW */}
            {activeTab === 'alerts' && (
              <View style={styles.tabContent}>
                <Text style={[styles.sectionHeading, { color: theme.text }]}>Active SOS Signals</Text>
                {requests.length === 0 ? (
                  <Text style={{ color: theme.textSecondary, fontStyle: 'italic', marginVertical: 20 }}>
                    No active SOS requests registered.
                  </Text>
                ) : (
                  requests.map((req) => (
                    <View
                      key={req.id}
                      style={[styles.bookingCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
                    >
                      <View style={styles.bookingCardHeader}>
                        <Text style={[styles.bookingName, { color: theme.text }]}>
                          {req.first_name} {req.last_name}
                        </Text>
                        <View style={styles.bloodTypeBadge}>
                          <Text style={styles.bloodTypeBadgeText}>{req.blood_type}</Text>
                        </View>
                      </View>

                      <View style={styles.bookingDetails}>
                        <Text style={[styles.detailsText, { color: theme.textSecondary }]}>
                          📞 {req.contact_number}
                        </Text>
                        <Text style={[styles.detailsText, { color: theme.textSecondary }]}>
                          📍 {req.location}
                        </Text>
                        {req.latitude && req.longitude ? (
                          <Text style={[styles.detailsText, { color: theme.textSecondary, fontSize: 10, fontFamily: 'monospace' }]}>
                            🛰 {req.latitude.toFixed(5)}, {req.longitude.toFixed(5)}
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.bookingActions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.resolveBtn]}
                          onPress={() => handleDeleteRequest(req.id)}
                        >
                          <Text style={styles.actionBtnText}>Resolve / Close Request</Text>
                        </TouchableOpacity>
                      </View>
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 48,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BottomTabInset + Spacing.six,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
  },
  errorBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.25)',
    borderRadius: 12,
    padding: Spacing.two,
    marginBottom: Spacing.four,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabContent: {
    gap: 16,
  },
  statCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.four,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabelText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookingCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  bookingDetails: {
    gap: 4,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: Spacing.three,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtn: {
    backgroundColor: '#059669',
  },
  cancelBtn: {
    backgroundColor: '#dc2626',
  },
  resolveBtn: {
    backgroundColor: '#dc2626',
    flex: 1,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bloodTypeBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  bloodTypeBadgeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 10,
  },
});
