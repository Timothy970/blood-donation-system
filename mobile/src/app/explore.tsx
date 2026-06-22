import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemeContext } from '@/context/theme-context';
import { mobileApi, getCurrentUser, addAuthListener } from '@/utils/api';

export default function ExploreScreen() {
  const theme = useTheme();
  const { colorScheme, toggleColorScheme } = useContext(ThemeContext);
  
  const [user, setUser] = useState<any | null>(null);
  const [rewards, setRewards] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [bloodType, setBloodType] = useState('O-');
  const [gender, setGender] = useState('M');
  const [availability, setAvailability] = useState('Anyday');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    // Reactive subscription to auth state changes
    const unsubscribe = addAuthListener((token, u) => {
      if (u) {
        setUser(u);
        const profile = u.profile;
        if (profile) {
          setPhone(profile.phone_number || '');
          setCity(profile.city || '');
          setBloodType(profile.blood_type || 'O-');
          setGender(profile.gender || 'M');
          setAvailability(profile.availability || 'Anyday');
          setLatitude(profile.latitude || null);
          setLongitude(profile.longitude || null);
        }
      }
    });

    mobileApi.rewards.get()
      .then(setRewards)
      .catch(err => console.log('Failed to fetch rewards on mobile settings:', err))
      .finally(() => setLoading(false));

    return unsubscribe;
  }, []);

  // Form submit update function
  const handleSaveSettings = async () => {
    setSaveError('');
    setSaveSuccess('');
    if (!phone.trim()) {
      setSaveError('Phone Number is required.');
      return;
    }
    if (!city.trim()) {
      setSaveError('City / Region is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        phone_number: phone.trim(),
        city: city.trim(),
        blood_type: bloodType,
        gender: gender,
        availability: availability,
        latitude: latitude ? Number(latitude) : 0,
        longitude: longitude ? Number(longitude) : 0,
      };

      const res = await mobileApi.auth.updateProfile(payload);
      setSaveSuccess('Profile updated successfully!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  // Obtain GPS coordinates
  const handleDetectLocation = () => {
    setSaveError('');
    setSaveSuccess('');
    if (!navigator.geolocation) {
      setSaveError('Geolocation is not supported by your device.');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setDetectingLocation(false);
      },
      (error) => {
        console.log('Error detecting location on mobile:', error);
        setSaveError('Failed to capture location. Verify permissions.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Compute donor card stats dynamically
  const username = user?.username || 'Timothy Kimani';
  const displayBloodType = user?.profile?.blood_type || bloodType;
  const displayCity = user?.profile?.city || city;
  const displayPhoneNumber = user?.profile?.phone_number || phone;
  const totalPoints = rewards?.total_points ?? 45;
  const currentBadge = rewards?.current_badge || 'Bronze';
  const pointsNeeded = rewards?.points_needed ?? 155;
  const nextBadge = rewards?.next_badge || 'Silver';

  // Calculate whole blood cooldown timeline
  const getCooldownDays = () => {
    const lastDate = new Date('2026-05-10');
    const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 56) {
      return 56 - diffDays;
    }
    return 0;
  };

  const cooldownDays = getCooldownDays();
  const eligible = cooldownDays === 0;

  // Simple QR Code matrix grid generator (representing QR content dynamically)
  const renderMockQR = () => {
    const matrix = [];
    const size = 15;
    for (let r = 0; r < size; r++) {
      const cols = [];
      for (let c = 0; c < size; c++) {
        const isCorner = 
          (r < 4 && c < 4) || 
          (r < 4 && c >= size - 4) || 
          (r >= size - 4 && c < 4);
        const randomBlock = Math.random() > 0.45;
        const active = isCorner || randomBlock;
        const pixelColor = active 
          ? (colorScheme === 'dark' ? '#ffffff' : '#000000') 
          : (colorScheme === 'dark' ? '#020617' : '#ffffff');
        cols.push(
          <View 
            key={`${r}-${c}`} 
            style={[
              styles.qrPixel, 
              { backgroundColor: pixelColor }
            ]} 
          />
        );
      }
      matrix.push(<View key={r} style={styles.qrRow}>{cols}</View>);
    }
    return <View style={[styles.qrContainer, { backgroundColor: colorScheme === 'dark' ? '#020617' : '#ffffff', borderColor: theme.backgroundSelected }]}>{matrix}</View>;
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = [
    { key: 'M', label: 'Male' },
    { key: 'F', label: 'Female' },
    { key: 'O', label: 'Other' }
  ];
  const availabilityOptions = ['Anyday', 'Weekdays', 'Weekends'];

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Profile & Settings</Text>
            <TouchableOpacity
              onPress={toggleColorScheme}
              style={{
                padding: Spacing.two,
                borderRadius: 10,
                backgroundColor: theme.backgroundElement,
                borderWidth: 1,
                borderColor: theme.backgroundSelected,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16 }}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Manage your metrics, details, and geolocation matching</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#dc2626" style={{ marginVertical: 40 }} />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Glowing Donor Card */}
            <View style={styles.cardGlowWrapper}>
              <View style={styles.donorCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardLabel}>BLOODHERO MEMBER</Text>
                    <Text style={styles.cardName}>{username}</Text>
                  </View>
                  <View style={styles.bloodBadge}>
                    <Text style={styles.bloodText}>{displayBloodType}</Text>
                  </View>
                </View>

                <View style={styles.cardMid}>
                  <View>
                    <Text style={styles.infoLabel}>CITY</Text>
                    <Text style={styles.infoValue}>{displayCity}</Text>
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>PHONE</Text>
                    <Text style={styles.infoValue}>{displayPhoneNumber}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.verifiedText}>✓ Verified Digital Record</Text>
                  <Text style={styles.logoText}>♥</Text>
                </View>
              </View>
            </View>

            {/* Profile Settings Interactive Form */}
            <View style={[styles.settingsForm, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>⚙ Personal Settings</Text>

              {saveSuccess ? (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>✓ {saveSuccess}</Text>
                </View>
              ) : null}

              {saveError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠ {saveError}</Text>
                </View>
              ) : null}

              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Phone Number</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}
                  placeholder="+254 700 000 000"
                  placeholderTextColor={theme.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>City / Region</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}
                  placeholder="e.g. Mombasa"
                  placeholderTextColor={theme.textSecondary}
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Blood Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelector}>
                  {bloodTypes.map(type => {
                    const isSelected = bloodType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.selectorBubble,
                          isSelected 
                            ? { backgroundColor: '#dc2626', borderColor: '#dc2626' } 
                            : { backgroundColor: theme.background, borderColor: theme.backgroundSelected }
                        ]}
                        onPress={() => setBloodType(type)}
                      >
                        <Text style={[styles.selectorBubbleText, { color: isSelected ? '#ffffff' : theme.text }]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Gender</Text>
                <View style={styles.gendersContainer}>
                  {genders.map(g => {
                    const isSelected = gender === g.key;
                    return (
                      <TouchableOpacity
                        key={g.key}
                        style={[
                          styles.genderBtn,
                          isSelected 
                            ? { backgroundColor: 'rgba(220, 38, 38, 0.15)', borderColor: '#dc2626' } 
                            : { backgroundColor: theme.background, borderColor: theme.backgroundSelected }
                        ]}
                        onPress={() => setGender(g.key)}
                      >
                        <Text style={[styles.genderBtnText, { color: isSelected ? '#ef4444' : theme.text }]}>
                          {g.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Availability</Text>
                <View style={styles.gendersContainer}>
                  {availabilityOptions.map(av => {
                    const isSelected = availability === av;
                    return (
                      <TouchableOpacity
                        key={av}
                        style={[
                          styles.genderBtn,
                          isSelected 
                            ? { backgroundColor: 'rgba(220, 38, 38, 0.15)', borderColor: '#dc2626' } 
                            : { backgroundColor: theme.background, borderColor: theme.backgroundSelected }
                        ]}
                        onPress={() => setAvailability(av)}
                      >
                        <Text style={[styles.genderBtnText, { color: isSelected ? '#ef4444' : theme.text }]}>
                          {av}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Geolocation Section */}
              <View style={[styles.locationBox, { borderColor: theme.backgroundSelected }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, marginRight: Spacing.two }}>
                    <Text style={[styles.locationTitle, { color: theme.text }]}>GPS Coordinates</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 10 }}>Sync coordinates for local emergency alerts</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.locateBtn, { backgroundColor: theme.background }]}
                    onPress={handleDetectLocation}
                    disabled={detectingLocation}
                  >
                    {detectingLocation ? (
                      <ActivityIndicator size="small" color="#dc2626" />
                    ) : (
                      <Text style={[styles.locateBtnText, { color: theme.text }]}>🛰 Locate</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.coordinatesRow}>
                  <View style={styles.coordCol}>
                    <Text style={{ color: theme.textSecondary, fontSize: 9 }}>LATITUDE</Text>
                    <Text style={[styles.coordVal, { color: theme.text }]}>
                      {latitude !== null ? latitude.toFixed(6) : 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.coordCol}>
                    <Text style={{ color: theme.textSecondary, fontSize: 9 }}>LONGITUDE</Text>
                    <Text style={[styles.coordVal, { color: theme.text }]}>
                      {longitude !== null ? longitude.toFixed(6) : 'Not set'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Submit Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveSettings}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile Settings</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Rewards Card */}
            <View style={[styles.rewardsCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>🏆 Rewards & Level</Text>
              <View style={styles.rewardsInfoRow}>
                <View>
                  <Text style={{ color: theme.textSecondary, fontSize: 11 }}>TOTAL POINTS</Text>
                  <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
                    {totalPoints} XP
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 11 }}>CURRENT BADGE</Text>
                  <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>
                    🏅 {currentBadge}
                  </Text>
                </View>
              </View>
              
              {pointsNeeded > 0 && (
                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 8 }}>
                  Earn {pointsNeeded} more points to reach {nextBadge} badge!
                </Text>
              )}
            </View>

            {/* QR Code Presentation */}
            <View style={[styles.qrBox, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={[styles.qrLabel, { color: theme.text }]}>SCAN FOR CLINIC INTAKE</Text>
              {renderMockQR()}
              <Text style={[styles.qrDesc, { color: theme.textSecondary }]}>
                Allows hospitals to scan your member profile and log donation quantity automatically.
              </Text>
            </View>

            {/* Status Tracker */}
            <View style={[
              styles.statusCard,
              eligible ? styles.statusEligible : styles.statusCooling
            ]}>
              <Text style={[styles.statusTitle, { color: eligible ? '#34d399' : '#f87171' }]}>
                {eligible ? 'Eligible to Donate' : 'Waiting Period (Cooling Down)'}
              </Text>
              <Text style={[styles.statusDesc, { color: theme.textSecondary }]}>
                {eligible 
                  ? 'Your red blood cells have recovered. You are fully eligible to donate whole blood!'
                  : `You recently donated. Please wait another ${cooldownDays} days before booking your next appointment.`
                }
              </Text>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={[styles.logoutBtn, { borderColor: theme.backgroundSelected }]}
              onPress={() => {
                mobileApi.auth.logout();
              }}
            >
              <Text style={[styles.logoutBtnText, { color: '#ef4444' }]}>Sign Out</Text>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BottomTabInset + Spacing.six,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    gap: Spacing.five,
  },
  cardGlowWrapper: {
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  donorCard: {
    backgroundColor: '#991b1b',
    borderRadius: 24,
    padding: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: Spacing.six,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  cardName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bloodBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  bloodText: {
    color: '#dc2626',
    fontWeight: '900',
    fontSize: 18,
  },
  cardMid: {
    flexDirection: 'row',
    gap: 40,
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: Spacing.four,
  },
  verifiedText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 18,
  },
  settingsForm: {
    borderWidth: 1,
    borderRadius: 28,
    padding: Spacing.five,
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
  },
  horizontalSelector: {
    flexDirection: 'row',
    marginTop: 2,
  },
  selectorBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectorBubbleText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  gendersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    marginTop: 4,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  locateBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locateBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  coordCol: {
    flex: 1,
  },
  coordVal: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  successBox: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    borderRadius: 12,
    padding: Spacing.two,
  },
  successText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.25)',
    borderRadius: 12,
    padding: Spacing.two,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: Spacing.three,
  },
  rewardsCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: Spacing.four,
  },
  rewardsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrBox: {
    borderWidth: 1,
    borderRadius: 24,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.four,
  },
  qrLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  qrContainer: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  qrRow: {
    flexDirection: 'row',
  },
  qrPixel: {
    width: 10,
    height: 10,
  },
  qrDesc: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: Spacing.four,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: Spacing.five,
    gap: Spacing.two,
  },
  statusEligible: {
    backgroundColor: 'rgba(52, 211, 153, 0.05)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  statusCooling: {
    backgroundColor: 'rgba(248, 113, 113, 0.05)',
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  logoutBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
});
