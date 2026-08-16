import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemeContext } from '@/context/theme-context';
import { mobileApi, BloodRequest, getCurrentUser, addAuthListener } from '@/utils/api';

export default function RequestsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useContext(ThemeContext);

  const [currentUser, setCurrentUser] = useState<any>(getCurrentUser());
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);

  // Refresh and Loading
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showSosForm, setShowSosForm] = useState(false);
  const [sosFormData, setSosFormData] = useState({
    first_name: '',
    last_name: '',
    blood_type: 'A+',
    contact_number: '',
    location: '',
    latitude: 0,
    longitude: 0,
    is_emergency: false,
  });
  const [sosSuccess, setSosSuccess] = useState('');
  const [sosError, setSosError] = useState('');
  const [sosSubmitting, setSosSubmitting] = useState(false);
  const [locatingSos, setLocatingSos] = useState(false);
  const [matchedDonors, setMatchedDonors] = useState<any[]>([]);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    const unsubscribe = addAuthListener((token, user) => {
      setCurrentUser(user);
      if (user) {
        setSosFormData(prev => ({
          ...prev,
          first_name: user.username,
          contact_number: user.profile?.phone_number || '',
          location: user.profile?.city || '',
        }));
      }
    });
    fetchRequests();
    return unsubscribe;
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await mobileApi.requests.list();
      setRequests(data || []);
    } catch (err) {
      console.log('Failed to fetch SOS requests on mobile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleSosInputChange = (field: string, value: any) => {
    setSosFormData(prev => ({ ...prev, [field]: value }));
  };

  const detectSosLocation = () => {
    setSosError('');
    if (!navigator.geolocation) {
      setSosError('Geolocation is not supported by your mobile device.');
      return;
    }

    setLocatingSos(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSosFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocatingSos(false);
      },
      (error) => {
        console.log('Geolocation error on SOS form:', error);
        setSosError('Could not detect GPS location. Enter location manually.');
        setLocatingSos(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSosSubmit = async () => {
    setSosError('');
    setSosSuccess('');
    setMatchedDonors([]);

    if (!sosFormData.first_name.trim()) {
      setSosError('Recipient name is required.');
      return;
    }
    if (!sosFormData.contact_number.trim()) {
      setSosError('Contact phone number is required.');
      return;
    }
    if (!sosFormData.location.trim()) {
      setSosError('Hospital or clinic location is required.');
      return;
    }

    setSosSubmitting(true);
    try {
      const result = await mobileApi.requests.create({
        first_name: sosFormData.first_name.trim(),
        last_name: sosFormData.last_name.trim(),
        blood_type: sosFormData.blood_type,
        contact_number: sosFormData.contact_number.trim(),
        location: sosFormData.location.trim(),
        latitude: sosFormData.latitude ? Number(sosFormData.latitude) : 0,
        longitude: sosFormData.longitude ? Number(sosFormData.longitude) : 0,
        is_emergency: sosFormData.is_emergency,
      });

      setSosSuccess('Emergency SOS alert successfully broadcasted to regional network!');
      if (result.matching_donors && result.matching_donors.length > 0) {
        setMatchedDonors(result.matching_donors);
      }
      setShowSosForm(false);
      fetchRequests();
    } catch (err: any) {
      setSosError(err.message || 'Failed to submit blood request broadcast.');
    } finally {
      setSosSubmitting(false);
    }
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>SOS Emergency Network</Text>
            </View>
            <TouchableOpacity onPress={toggleColorScheme} style={[styles.themeToggleBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={{ fontSize: 16 }}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.secondary }]}>REAL-TIME PROXIMITY & BIOLOGICAL COMPATIBILITY MATCHING</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          {/* Header Card with Broadcast SOS Button */}
          <View style={[styles.broadcastBanner, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.broadcastTitle, { color: theme.text }]}>Emergency SOS Network</Text>
              <Text style={[styles.broadcastSub, { color: theme.textSecondary }]}>Broadcast urgent blood requirements to compatible nearby donors</Text>
            </View>
            <TouchableOpacity
              style={[styles.broadcastBtn, { backgroundColor: theme.primaryNeon }]}
              onPress={() => {
                setShowSosForm(!showSosForm);
                setMatchedDonors([]);
              }}
            >
              <Text style={styles.broadcastBtnText}>+ BROADCAST SOS</Text>
            </TouchableOpacity>
          </View>

          {/* SOS Broadcast Creation Form Modal/Collapsible */}
          {showSosForm && (
            <View style={[styles.formCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={[styles.formTitle, { color: theme.text }]}>🚨 Broadcast Emergency SOS Request</Text>

              {sosError ? <Text style={styles.errorText}>⚠ {sosError}</Text> : null}

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>RECIPIENT NAME</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}
                  placeholder="First & Last Name"
                  placeholderTextColor={theme.textSecondary}
                  value={sosFormData.first_name}
                  onChangeText={(val) => handleSosInputChange('first_name', val)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>BLOOD GROUP REQUIRED</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bloodSelector}>
                  {bloodTypes.map(type => {
                    const isSelected = sosFormData.blood_type === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.bloodBubble, 
                          isSelected 
                            ? { backgroundColor: theme.primaryNeon, borderColor: theme.primary } 
                            : { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }
                        ]}
                        onPress={() => handleSosInputChange('blood_type', type)}
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
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>CONTACT PHONE NUMBER</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}
                  placeholder="+254 700 000 000"
                  placeholderTextColor={theme.textSecondary}
                  value={sosFormData.contact_number}
                  onChangeText={(val) => handleSosInputChange('contact_number', val)}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>HOSPITAL / CLINIC LOCATION</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}
                  placeholder="e.g. Kenyatta National Hospital, Ward 4B"
                  placeholderTextColor={theme.textSecondary}
                  value={sosFormData.location}
                  onChangeText={(val) => handleSosInputChange('location', val)}
                />
              </View>

              <View style={styles.gpsRow}>
                <TouchableOpacity style={[styles.gpsBtn, { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]} onPress={detectSosLocation} disabled={locatingSos}>
                  <Text style={[styles.gpsBtnText, { color: theme.secondary }]}>
                    {locatingSos ? '🛰 Detecting Location...' : '🛰 Sync Device GPS Location'}
                  </Text>
                </TouchableOpacity>
                {sosFormData.latitude !== 0 && (
                  <Text style={[styles.gpsCoordsText, { color: theme.secondary }]}>
                    GPS: {sosFormData.latitude.toFixed(4)}, {sosFormData.longitude.toFixed(4)}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.emergencyToggle, 
                  { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected },
                  sosFormData.is_emergency && { borderColor: theme.primaryNeon, backgroundColor: 'rgba(255, 0, 51, 0.1)' }
                ]}
                onPress={() => handleSosInputChange('is_emergency', !sosFormData.is_emergency)}
              >
                <Text style={[styles.emergencyToggleText, { color: sosFormData.is_emergency ? theme.primary : theme.textSecondary }]}>
                  {sosFormData.is_emergency ? '🔴 CRITICAL SOS EMERGENCY (HIGH PRIORITY)' : '⚪ Standard Blood Request'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primaryNeon }]} onPress={handleSosSubmit} disabled={sosSubmitting}>
                {sosSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>TRANSMIT SOS ALERT NOW</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {sosSuccess ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✓ {sosSuccess}</Text>
            </View>
          ) : null}

          {/* Matched Donors Card */}
          {matchedDonors.length > 0 && (
            <View style={[styles.matchedCard, { backgroundColor: theme.backgroundElement, borderColor: theme.bioGreen }]}>
              <Text style={[styles.matchedTitle, { color: theme.bioGreen }]}>🎯 Matched Compatible Donors ({matchedDonors.length})</Text>
              {matchedDonors.map((donor, idx) => (
                <View key={idx} style={[styles.matchedRow, { backgroundColor: theme.backgroundDim }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.matchedName, { color: theme.text }]}>{donor.username}</Text>
                    <Text style={[styles.matchedDetails, { color: theme.textSecondary }]}>Blood Group: {donor.profile?.blood_type} • City: {donor.profile?.city}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.matchedChatBtn, { backgroundColor: theme.primaryNeon }]}
                    onPress={() => router.push(`/chat?other_id=${donor.id}` as any)}
                  >
                    <Text style={styles.matchedChatBtnText}>Chat Now</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* SOS Requests Feed List */}
          {loading ? (
            <ActivityIndicator color={theme.primary} size="large" style={{ marginVertical: 40 }} />
          ) : requests.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Active SOS Emergency Alerts</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>All emergency blood stock requirements are currently fulfilled.</Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {requests.map((item) => (
                <View key={item.id} style={[styles.requestCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.patientName, { color: theme.text }]}>{item.first_name} {item.last_name}</Text>
                      <Text style={[styles.locationText, { color: theme.secondary }]}>📍 {item.location}</Text>
                    </View>
                    <View style={[styles.bloodPill, { backgroundColor: 'rgba(255, 0, 51, 0.15)', borderColor: 'rgba(255, 0, 51, 0.3)' }]}>
                      <Text style={[styles.bloodPillText, { color: theme.primary }]}>{item.blood_type}</Text>
                    </View>
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: theme.backgroundSelected }]}>
                    <Text style={[styles.contactText, { color: theme.textSecondary }]}>📞 {item.contact_number}</Text>
                    {item.is_emergency ? (
                      <View style={[styles.emergencyBadge, { backgroundColor: theme.primaryNeon }]}>
                        <Text style={styles.emergencyBadgeText}>SOS EMERGENCY</Text>
                      </View>
                    ) : (
                      <View style={[styles.standardBadge, { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}>
                        <Text style={[styles.standardBadgeText, { color: theme.textSecondary }]}>Standard</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
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
  broadcastBanner: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  broadcastTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  broadcastSub: {
    fontSize: 10,
  },
  broadcastBtn: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  broadcastBtnText: {
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
  gpsRow: {
    gap: 6,
  },
  gpsBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  gpsBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  gpsCoordsText: {
    fontSize: 10,
    textAlign: 'center',
  },
  emergencyToggle: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  emergencyToggleText: {
    fontSize: 11,
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
  matchedCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  matchedTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  matchedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
  },
  matchedName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  matchedDetails: {
    fontSize: 10,
    marginTop: 2,
  },
  matchedChatBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  matchedChatBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
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
  requestCard: {
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
  patientName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  locationText: {
    fontSize: 11,
    marginTop: 2,
  },
  bloodPill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bloodPillText: {
    fontWeight: '900',
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  contactText: {
    fontSize: 11,
  },
  emergencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  emergencyBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 9,
  },
  standardBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  standardBadgeText: {
    fontWeight: 'bold',
    fontSize: 9,
  },
});
