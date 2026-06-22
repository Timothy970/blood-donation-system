import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { mobileApi, Booking } from '@/utils/api';

const CLINICS = [
  'Nairobi Blood Center (HQ)',
  'Eldoret Regional Blood Bank',
  'Mombasa General Hospital',
  'Kisumu Blood Transfusion Unit',
  'Nakuru Level 5 Clinic',
];

const TIME_SLOTS = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:35', '15:00', '15:30', '16:00'
];

export default function BookScreen() {
  const theme = useTheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedClinic, setSelectedClinic] = useState(CLINICS[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[1]);
  
  // Generate next 7 days for the interactive date selector
  const [dates, setDates] = useState<{ dayName: string; dayNum: number; fullDate: Date }[]>([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  useEffect(() => {
    // Generate dates
    const dList = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dList.push({
        dayName: days[d.getDay()],
        dayNum: d.getDate(),
        fullDate: d,
      });
    }
    setDates(dList);
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await mobileApi.bookings.list();
      setBookings(data);
    } catch (err) {
      console.log('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleBookAppointment = async () => {
    if (dates.length === 0) return;
    setSubmitting(true);
    
    try {
      const dateStr = dates[selectedDateIndex].fullDate.toISOString();
      const payload = {
        first_name: 'Timothy',
        last_name: 'Kimani',
        date: dateStr,
        time_slot: selectedTimeSlot,
        location: selectedClinic,
      };

      await mobileApi.bookings.create(payload);
      Alert.alert('Success', 'Donation appointment scheduled successfully!');
      fetchBookings();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Schedule Donation</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Book slots and check active appointments</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Booking Card Form */}
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>♥ Book New Slot</Text>

            {/* Date Selector */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Select Donation Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesList}>
              {dates.map((d, index) => {
                const isSelected = selectedDateIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateBubble,
                      isSelected 
                        ? { backgroundColor: '#dc2626', borderColor: '#dc2626' } 
                        : { backgroundColor: theme.background, borderColor: theme.backgroundSelected }
                    ]}
                    onPress={() => setSelectedDateIndex(index)}
                  >
                    <Text style={[styles.dateDay, { color: isSelected ? '#ffffff' : theme.textSecondary }]}>
                      {d.dayName}
                    </Text>
                    <Text style={[styles.dateNum, { color: isSelected ? '#ffffff' : theme.text }]}>
                      {d.dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Slot Select */}
            <Text style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.three }]}>Select Time Slot</Text>
            <View style={styles.gridContainer}>
              {TIME_SLOTS.slice(0, 8).map((slot) => {
                const isSelected = selectedTimeSlot === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.timeBubble,
                      isSelected 
                        ? { backgroundColor: '#dc2626', borderColor: '#dc2626' } 
                        : { backgroundColor: theme.background, borderColor: theme.backgroundSelected }
                    ]}
                    onPress={() => setSelectedTimeSlot(slot)}
                  >
                    <Text style={[styles.timeText, { color: isSelected ? '#ffffff' : theme.text }]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Clinic Dropdown selection */}
            <Text style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.three }]}>Select Center</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clinicsList}>
              {CLINICS.map((clinic) => {
                const isSelected = selectedClinic === clinic;
                return (
                  <TouchableOpacity
                    key={clinic}
                    style={[
                      styles.clinicItem,
                      isSelected 
                        ? { backgroundColor: 'rgba(220, 38, 38, 0.1)', borderColor: '#dc2626' } 
                        : { backgroundColor: theme.background, borderColor: theme.backgroundSelected }
                    ]}
                    onPress={() => setSelectedClinic(clinic)}
                  >
                    <Text style={[styles.clinicText, { color: isSelected ? '#ef4444' : theme.text }]}>
                      {clinic.split(' (')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Submit */}
            <TouchableOpacity
              style={styles.bookButton}
              onPress={handleBookAppointment}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.bookButtonText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Active Bookings list */}
          <View style={styles.historyContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: Spacing.three }]}>📋 Scheduled Appointments</Text>
            
            {loading ? (
              <ActivityIndicator color="#dc2626" style={{ marginVertical: 20 }} />
            ) : bookings.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: theme.backgroundSelected }]}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No upcoming appointments scheduled.</Text>
              </View>
            ) : (
              <View style={{ gap: Spacing.three }}>
                {bookings.map((booking) => (
                  <View 
                    key={booking.id}
                    style={[styles.bookingItem, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
                  >
                    <View style={styles.bookingLeft}>
                      <Text style={[styles.bookingName, { color: theme.text }]}>{booking.location}</Text>
                      <Text style={[styles.bookingTime, { color: theme.textSecondary }]}>
                        📅 {new Date(booking.date).toLocaleDateString()} • {booking.time_slot}
                      </Text>
                    </View>
                    <View style={styles.bookingRight}>
                      <View style={[
                        styles.statusBadge,
                        booking.status === 'Pending'
                          ? { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }
                          : { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          booking.status === 'Pending' ? { color: '#f59e0b' } : { color: '#10b981' }
                        ]}>
                          {booking.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BottomTabInset + Spacing.six,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  datesList: {
    flexDirection: 'row',
    marginTop: Spacing.one,
  },
  dateBubble: {
    width: 54,
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dateDay: {
    fontSize: 10,
    fontWeight: '600',
  },
  dateNum: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.one,
  },
  timeBubble: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  clinicsList: {
    flexDirection: 'row',
    marginTop: Spacing.one,
  },
  clinicItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
  },
  bookButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historyContainer: {
    marginTop: Spacing.five,
  },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
  },
  bookingLeft: {
    flex: 1,
  },
  bookingName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  bookingTime: {
    fontSize: 11,
    marginTop: 4,
  },
  bookingRight: {
    marginLeft: Spacing.two,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
