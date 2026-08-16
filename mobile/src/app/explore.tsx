import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemeContext } from '@/context/theme-context';
import { mobileApi, getCurrentUser, addAuthListener } from '@/utils/api';

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
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

      await mobileApi.auth.updateProfile(payload);
      setSaveSuccess('Profile settings updated successfully!');
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
        setSaveError('Failed to capture location. Verify device permissions.');
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
        cols.push(
          <View 
            key={`${r}-${c}`} 
            style={[styles.qrPixel, { backgroundColor: active ? theme.text : theme.backgroundDim }]} 
          />
        );
      }
      matrix.push(<View key={r} style={styles.qrRow}>{cols}</View>);
    }
    return <View style={[styles.qrContainer, { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}>{matrix}</View>;
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>Digital Donor Card & Profile</Text>
            </View>
            <TouchableOpacity onPress={toggleColorScheme} style={[styles.themeToggleBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={{ fontSize: 16 }}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.secondary }]}>CLINIC SCAN IDENTIFIER & BIOLOGICAL PROFILE METRICS</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} size="large" style={{ marginVertical: 40 }} />
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Holographic Donor Card */}
            <View style={[styles.donorCard, { backgroundColor: theme.backgroundElement, borderColor: 'rgba(255, 0, 51, 0.4)' }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.cardLabel, { color: theme.secondary }]}>BLOODHERO MEMBER ID</Text>
                  <Text style={[styles.cardName, { color: theme.text }]}>{username}</Text>
                  <Text style={[styles.cardSub, { color: theme.textSecondary }]}>BH-884920 • NAIROBI REGISTRY</Text>
                </View>
                <View style={[styles.bloodBadge, { backgroundColor: theme.primaryNeon }]}>
                  <Text style={styles.bloodText}>{displayBloodType}</Text>
                </View>
              </View>

              <View style={styles.cardMid}>
                <View>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>CITY / REGION</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{displayCity || 'Nairobi'}</Text>
                </View>
                <View>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>CONTACT PHONE</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{displayPhoneNumber || 'Not set'}</Text>
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: theme.backgroundSelected }]}>
                <Text style={[styles.verifiedText, { color: theme.bioGreen }]}>✓ ELIGIBLE DONOR</Text>
                <Text style={[styles.logoText, { color: theme.primary }]}>♥ BLOODHERO</Text>
              </View>
            </View>

            {/* Profile & Health Details Form */}
            <View style={[styles.settingsForm, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>⚙ PERSONAL & HEALTH DETAILS</Text>

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
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PHONE NUMBER</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}
                  placeholder="+254 700 000 000"
                  placeholderTextColor={theme.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>CITY / REGION</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}
                  placeholder="e.g. Mombasa"
                  placeholderTextColor={theme.textSecondary}
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>BLOOD TYPE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelector}>
                  {bloodTypes.map(type => {
                    const isSelected = bloodType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.selectorBubble, 
                          { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected },
                          isSelected && { backgroundColor: theme.primaryNeon, borderColor: theme.primary }
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
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>GENDER</Text>
                <View style={styles.gendersContainer}>
                  {genders.map(g => {
                    const isSelected = gender === g.key;
                    return (
                      <TouchableOpacity
                        key={g.key}
                        style={[
                          styles.genderBtn, 
                          { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected },
                          isSelected && { backgroundColor: 'rgba(255, 0, 51, 0.15)', borderColor: theme.primaryNeon }
                        ]}
                        onPress={() => setGender(g.key)}
                      >
                        <Text style={[styles.genderBtnText, { color: isSelected ? theme.primary : theme.textSecondary }]}>
                          {g.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>AVAILABILITY</Text>
                <View style={styles.gendersContainer}>
                  {availabilityOptions.map(av => {
                    const isSelected = availability === av;
                    return (
                      <TouchableOpacity
                        key={av}
                        style={[
                          styles.genderBtn, 
                          { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected },
                          isSelected && { backgroundColor: 'rgba(255, 0, 51, 0.15)', borderColor: theme.primaryNeon }
                        ]}
                        onPress={() => setAvailability(av)}
                      >
                        <Text style={[styles.genderBtnText, { color: isSelected ? theme.primary : theme.textSecondary }]}>
                          {av}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Geolocation Section */}
              <View style={[styles.locationBox, { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.locationTitle, { color: theme.text }]}>GPS Coordinates</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 10 }}>Sync device location for emergency SOS alerts</Text>
                  </View>
                  <TouchableOpacity style={[styles.locateBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.primary }]} onPress={handleDetectLocation} disabled={detectingLocation}>
                    {detectingLocation ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Text style={[styles.locateBtnText, { color: theme.secondary }]}>🛰 Locate</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.coordinatesRow}>
                  <View style={styles.coordCol}>
                    <Text style={{ color: theme.textSecondary, fontSize: 9 }}>LATITUDE</Text>
                    <Text style={[styles.coordVal, { color: theme.secondary }]}>
                      {latitude !== null ? latitude.toFixed(6) : 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.coordCol}>
                    <Text style={{ color: theme.textSecondary, fontSize: 9 }}>LONGITUDE</Text>
                    <Text style={[styles.coordVal, { color: theme.secondary }]}>
                      {longitude !== null ? longitude.toFixed(6) : 'Not set'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Save Settings Button */}
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primaryNeon }]} onPress={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>SAVE PROFILE SETTINGS</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* QR Code Presentation */}
            <View style={[styles.qrBox, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={[styles.qrLabel, { color: theme.secondary }]}>SCAN FOR CLINIC INTAKE</Text>
              {renderMockQR()}
              <Text style={[styles.qrDesc, { color: theme.textSecondary }]}>
                Allows clinics to scan your digital profile and record blood donation quantity automatically.
              </Text>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: 'rgba(255, 0, 51, 0.1)', borderColor: 'rgba(255, 0, 51, 0.3)' }]} onPress={() => mobileApi.auth.logout()}>
              <Text style={[styles.logoutBtnText, { color: theme.primary }]}>SIGN OUT</Text>
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
  donorCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cardName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  cardSub: {
    fontSize: 9,
    marginTop: 2,
  },
  bloodBadge: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bloodText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
  },
  cardMid: {
    flexDirection: 'row',
    gap: 30,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  settingsForm: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  formGroup: {
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
    paddingVertical: 10,
    alignItems: 'center',
  },
  genderBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  locateBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  locateBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 16,
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
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
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
  qrBox: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  qrLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  qrContainer: {
    padding: 12,
    borderRadius: 14,
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
  },
  logoutBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutBtnText: {
    fontWeight: '900',
    fontSize: 12,
  },
});
