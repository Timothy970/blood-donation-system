import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemeContext } from '@/context/theme-context';
import { mobileApi, getCurrentUser, addAuthListener } from '@/utils/api';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useContext(ThemeContext);

  const [currentUser, setCurrentUser] = useState<any>(getCurrentUser());

  // Refresh and Loading
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dashboard States
  const [donations, setDonations] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any>(null);

  // Log Donation Form States
  const [showLogForm, setShowLogForm] = useState(false);
  const [logFormData, setLogFormData] = useState({
    date: '',
    location: '',
    blood_type: 'A+',
    quantity_ml: 450,
    notes: '',
  });
  const [logSuccess, setLogSuccess] = useState('');
  const [logError, setLogError] = useState('');
  const [logSubmitting, setLogSubmitting] = useState(false);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = addAuthListener((token, user) => {
      setCurrentUser(user);
      if (user) {
        setLogFormData(prev => ({
          ...prev,
          blood_type: user.profile?.blood_type || 'A+',
        }));
      }
    });
    fetchDashboardData();
    return unsubscribe;
  }, []);

  // Fetch Dashboard (Donations & Rewards)
  const fetchDashboardData = async () => {
    try {
      const donationList = await mobileApi.donations.list();
      setDonations(donationList || []);
      const rewardStats = await mobileApi.rewards.get();
      setRewards(rewardStats);
    } catch (err) {
      console.log('Backend dashboard data failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Submit Log Donation
  const handleLogSubmit = async () => {
    setLogError('');
    setLogSuccess('');

    if (!logFormData.date.trim()) {
      setLogError('Date of donation is required.');
      return;
    }
    if (!logFormData.location.trim()) {
      setLogError('Location/Center is required.');
      return;
    }

    setLogSubmitting(true);
    try {
      await mobileApi.donations.log({
        date: new Date(logFormData.date).toISOString(),
        location: logFormData.location.trim(),
        blood_type: logFormData.blood_type,
        quantity_ml: Number(logFormData.quantity_ml) || 450,
        notes: logFormData.notes.trim(),
      });

      setLogSuccess('Blood donation logged! XP points added to your balance.');
      setShowLogForm(false);
      setLogFormData({
        date: '',
        location: '',
        blood_type: currentUser?.profile?.blood_type || 'A+',
        quantity_ml: 450,
        notes: '',
      });
      fetchDashboardData();
    } catch (err: any) {
      setLogError(err.message || 'Failed to log donation.');
    } finally {
      setLogSubmitting(false);
    }
  };

  // Calculate 56-day whole blood cooldown eligibility
  const getCooldownEligibility = () => {
    if (!donations || donations.length === 0) {
      return { eligible: true, message: 'You have no recorded donations. You are fully eligible to donate whole blood!' };
    }

    const sorted = [...donations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDonationDate = new Date(sorted[0].date);
    const diffDays = Math.ceil(Math.abs(new Date().getTime() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 56) {
      const remaining = 56 - diffDays;
      return {
        eligible: false,
        message: `Cooling Period Active: You donated ${diffDays} days ago. Please wait another ${remaining} days before your next donation.`
      };
    }

    return { eligible: true, message: 'Your red blood cells have fully recovered! You are eligible to donate whole blood.' };
  };

  const cooling = getCooldownEligibility();

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusDot, { backgroundColor: theme.bioGreen }]} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>Donor Console</Text>
            </View>
            <TouchableOpacity onPress={toggleColorScheme} style={[styles.themeToggleBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={{ fontSize: 16 }}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.secondary }]}>MONITOR POINTS, LOG HISTORY & BIOLOGICAL ELIGIBILITY</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          {/* Action Header Section */}
          <View style={[styles.actionBanner, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>Donor Console Matrix</Text>
              <Text style={[styles.actionSub, { color: theme.textSecondary }]}>Log finished intake or check biological cooling status</Text>
            </View>
            <TouchableOpacity
              style={[styles.logBtn, { backgroundColor: theme.primaryNeon }]}
              onPress={() => setShowLogForm(!showLogForm)}
            >
              <Text style={styles.logBtnText}>+ Log Donation</Text>
            </TouchableOpacity>
          </View>

          {/* Log Donation Collapsible Form */}
          {showLogForm && (
            <View style={[styles.formCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={[styles.formTitle, { color: theme.text }]}>🩸 Log Completed Donation</Text>

              {logError ? <Text style={styles.errorText}>⚠ {logError}</Text> : null}

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>DATE OF DONATION (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}
                  placeholder="2026-08-16"
                  placeholderTextColor={theme.textSecondary}
                  value={logFormData.date}
                  onChangeText={(val) => setLogFormData(prev => ({ ...prev, date: val }))}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>LOCATION (CLINIC/HOSPITAL)</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}
                  placeholder="Nairobi Blood Center"
                  placeholderTextColor={theme.textSecondary}
                  value={logFormData.location}
                  onChangeText={(val) => setLogFormData(prev => ({ ...prev, location: val }))}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>BLOOD GROUP</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bloodSelector}>
                  {bloodTypes.map(type => {
                    const isSelected = logFormData.blood_type === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.bloodBubble, 
                          isSelected 
                            ? { backgroundColor: theme.primaryNeon, borderColor: theme.primary } 
                            : { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }
                        ]}
                        onPress={() => setLogFormData(prev => ({ ...prev, blood_type: type }))}
                      >
                        <Text style={[styles.bloodBubbleText, { color: isSelected ? '#ffffff' : theme.text }]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>QUANTITY (ML)</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}
                  placeholder="450"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={String(logFormData.quantity_ml)}
                  onChangeText={(val) => setLogFormData(prev => ({ ...prev, quantity_ml: Number(val) || 450 }))}
                />
              </View>

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primaryNeon }]} onPress={handleLogSubmit} disabled={logSubmitting}>
                {logSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>SAVE DONATION LOG</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {logSuccess ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✓ {logSuccess}</Text>
            </View>
          ) : null}

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={[styles.metricVal, { color: theme.text }]}>{rewards?.total_points || 0}</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total XP</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={[styles.metricVal, { color: theme.primary }]}>{rewards?.current_badge || 'Bronze'}</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Reward Tier</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={[styles.metricVal, { color: theme.secondary }]}>{donations.length}</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Donations</Text>
            </View>
          </View>

          {/* Cooldown Eligibility Alert Banner */}
          <View style={[
            styles.cooldownCard, 
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
            cooling.eligible ? { borderColor: 'rgba(0, 255, 148, 0.4)' } : { borderColor: 'rgba(255, 0, 51, 0.4)' }
          ]}>
            <Text style={[styles.cooldownTitle, cooling.eligible ? { color: theme.bioGreen } : { color: theme.primary }]}>
              {cooling.eligible ? 'Ready to Donate' : 'Waiting Cooldown Period'}
            </Text>
            <Text style={[styles.cooldownBody, { color: theme.textSecondary }]}>{cooling.message}</Text>
          </View>

          {/* Donation History List */}
          <View style={{ gap: 10 }}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DONATION HISTORY LOGS</Text>

            {loading ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
            ) : donations.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Donations Logged Yet</Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Log your finished donation above to earn XP rewards!</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {donations.map((d) => (
                  <View key={d.id} style={[styles.logCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                    <View style={styles.logLeft}>
                      <View style={[styles.bloodTypePill, { backgroundColor: 'rgba(255, 0, 51, 0.15)', borderColor: 'rgba(255, 0, 51, 0.3)' }]}>
                        <Text style={[styles.bloodTypePillText, { color: theme.primary }]}>{d.blood_type}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.logLocation, { color: theme.text }]}>📍 {d.location}</Text>
                        <Text style={[styles.logDate, { color: theme.textSecondary }]}>📅 {new Date(d.date).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text style={[styles.logQuantity, { color: theme.textSecondary }]}>{d.quantity_ml} ml</Text>
                      <Text style={[styles.logXp, { color: theme.bioGreen }]}>+{d.points_earned} XP</Text>
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
    gap: 16,
  },
  actionBanner: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionSub: {
    fontSize: 10,
  },
  logBtn: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 11,
  },
  formCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF5357',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  bloodSelector: {
    flexDirection: 'row',
    marginTop: 4,
  },
  bloodBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bloodBubbleText: {
    fontSize: 13,
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
  successBox: {
    backgroundColor: 'rgba(0, 255, 148, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 148, 0.3)',
    borderRadius: 14,
    padding: 12,
  },
  successText: {
    color: '#00FF94',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cooldownCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  cooldownTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  cooldownBody: {
    fontSize: 11,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
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
  logCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  bloodTypePill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bloodTypePillText: {
    fontWeight: '900',
    fontSize: 13,
  },
  logLocation: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  logDate: {
    fontSize: 10,
  },
  logQuantity: {
    fontSize: 11,
  },
  logXp: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
