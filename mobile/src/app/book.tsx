import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemeContext } from '@/context/theme-context';
import { mobileApi, Booking, getCurrentUser } from '@/utils/api';

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
  const { colorScheme, toggleColorScheme } = useContext(ThemeContext);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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

    // Pre-fill first name
    const user = getCurrentUser();
    if (user) {
      setFirstName(user.username || '');
    }
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await mobileApi.bookings.list();
      setBookings(data || []);
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
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First Name and Last Name are required.');
      return;
    }

    setSubmitting(true);
    try {
      const dateStr = dates[selectedDateIndex].fullDate.toISOString();
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
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

  const handleCancelBooking = (id: number) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this scheduled donation appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await mobileApi.bookings.delete(id);
              Alert.alert('Success', 'Appointment cancelled successfully.');
              fetchBookings();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel appointment.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* StandardizedHeader with Theme Toggle */}
        <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>Schedule Donation</Text>
            </View>
            <TouchableOpacity onPress={toggleColorScheme} style={[styles.themeToggleBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={{ fontSize: 16 }}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.secondary }]}>APPOINTMENT SCHEDULING MATRIX & CLINIC RESERVATIONS</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Booking Card Form */}
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>🩸 Book New Appointment Slot</Text>

            {/* Donor Names */}
            <View style={styles.nameFieldsRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>First Name</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}
                  placeholder="First name"
                  placeholderTextColor={theme.textSecondary}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Last Name</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}
                  placeholder="Doe"
                  placeholderTextColor={theme.textSecondary}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

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
                        ? { backgroundColor: theme.primaryNeon, borderColor: theme.primary } 
                        : { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }
                    ]}
                    onPress={() => setSelectedDateIndex(index)}
                  >
                    <Text style={[styles.dateDayName, { color: isSelected ? '#ffffff' : theme.textSecondary }]}>{d.dayName}</Text>
                    <Text style={[styles.dateDayNum, { color: isSelected ? '#ffffff' : theme.text }]}>{d.dayNum}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Slots */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Select Time Slot</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesList}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTimeSlot === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.timeBubble,
                      isSelected 
                        ? { backgroundColor: theme.primaryNeon, borderColor: theme.primary } 
                        : { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }
                    ]}
                    onPress={() => setSelectedTimeSlot(slot)}
                  >
                    <Text style={[styles.timeText, { color: isSelected ? '#ffffff' : theme.text }]}>{slot}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Clinic Selector */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Select Regional Clinic</Text>
            <View style={styles.clinicsColumn}>
              {CLINICS.map((clinic) => {
                const isSelected = selectedClinic === clinic;
                return (
                  <TouchableOpacity
                    key={clinic}
                    style={[
                      styles.clinicCardBtn,
                      isSelected 
                        ? { backgroundColor: 'rgba(255, 0, 51, 0.15)', borderColor: theme.primaryNeon } 
                        : { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }
                    ]}
                    onPress={() => setSelectedClinic(clinic)}
                  >
                    <Text style={[styles.clinicBtnText, { color: isSelected ? theme.primary : theme.text }]}>📍 {clinic}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.primaryNeon }]}
              onPress={handleBookAppointment}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>CONFIRM & SCHEDULE APPOINTMENT</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Scheduled Appointments List */}
          <View style={{ gap: Spacing.three }}>
            <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>YOUR SCHEDULED APPOINTMENTS</Text>

            {loading ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
            ) : bookings.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No upcoming donation appointments scheduled.</Text>
              </View>
            ) : (
              bookings.map((b) => (
                <View key={b.id} style={[styles.bookingItemCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                  <View style={styles.bookingHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bookingTitle, { color: theme.text }]}>📍 {b.location}</Text>
                      <Text style={[styles.bookingSub, { color: theme.textSecondary }]}>
                        📅 {new Date(b.date).toLocaleDateString()} at {b.time_slot}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusPill,
                      b.status === 'Pending' ? styles.statusPending : b.status === 'Completed' ? styles.statusCompleted : styles.statusCancelled
                    ]}>
                      <Text style={styles.statusPillText}>{b.status}</Text>
                    </View>
                  </View>

                  {b.status === 'Pending' && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelBooking(b.id)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BottomTabInset + 60,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  card: {
    borderRadius: 20,
    padding: Spacing.four,
    borderWidth: 1,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  nameFieldsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  datesList: {
    flexDirection: 'row',
  },
  dateBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 8,
    minWidth: 50,
  },
  dateDayName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateDayNum: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  timeBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  clinicsColumn: {
    gap: 8,
  },
  clinicCardBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  clinicBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  bookingItemCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  bookingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bookingSub: {
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPending: {
    backgroundColor: 'rgba(255, 171, 0, 0.15)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(0, 255, 148, 0.15)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(145, 144, 149, 0.15)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#E5E2E3',
  },
  cancelBtn: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  cancelBtnText: {
    color: '#FF5357',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
