import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Linking, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemeContext } from '@/context/theme-context';

// Define Interface
interface BloodRequest {
  id: number;
  first_name: string;
  last_name: string;
  blood_type: string;
  contact_number: string;
  location: string;
  is_emergency: boolean;
}

// Fallback Mock Data in case backend is unreachable on localhost from simulator/emulator
const MOCK_ALERTS: BloodRequest[] = [
  {
    id: 1,
    first_name: 'Timothy',
    last_name: 'Kariuki',
    blood_type: 'O-',
    contact_number: '+254712345678',
    location: 'Nairobi National Hospital',
    is_emergency: true,
  },
  {
    id: 2,
    first_name: 'Esther',
    last_name: 'Wanjiku',
    blood_type: 'AB+',
    contact_number: '+254789101112',
    location: 'Aga Khan Medical Center',
    is_emergency: true,
  },
  {
    id: 3,
    first_name: 'Michael',
    last_name: 'Otieno',
    blood_type: 'A+',
    contact_number: '+254755566677',
    location: 'Mombasa Coast Hospital',
    is_emergency: false,
  }
];

export default function HomeScreen() {
  const theme = useTheme();
  const { colorScheme, toggleColorScheme } = useContext(ThemeContext);
  const [requests, setRequests] = useState<BloodRequest[]>(MOCK_ALERTS);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // In mobile development, localhost is accessed via 10.0.2.2 on Android Emulator or local IP.
      // We list the fallback mock data by default and try to fetch from local dev API if configured.
      const response = await fetch('http://10.0.2.2:8080/api/requests');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setRequests(data);
        }
      }
    } catch (err) {
      console.log('Using local mock data fallback. Backend not reachable on 10.0.2.2.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleRespond = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const message = `Hello ${name}, I saw your blood request on the BloodHero app and would like to help.`;
    const url = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(`tel:${cleanPhone}`);
        }
      })
      .catch((err) => console.error('An error occurred opening WhatsApp link', err));
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={styles.brandContainer}>
              <View style={styles.heartIcon}>
                <Text style={styles.heartText}>♥</Text>
              </View>
              <Text style={[styles.brandTitle, { color: theme.text }]}>BloodHero</Text>
            </View>
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
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Active SOS Alerts Feed</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />
          }
        >
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#dc2626" style={styles.loader} />
          ) : (
            <View style={styles.cardsContainer}>
              {requests.map((req) => (
                <View
                  key={req.id}
                  style={[
                    styles.card,
                    req.is_emergency ? styles.emergencyCard : [styles.regularCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View>
                      <View style={styles.nameRow}>
                        <Text style={[styles.cardName, { color: theme.text }]}>
                          {req.first_name} {req.last_name}
                        </Text>
                        {req.is_emergency && (
                          <View style={styles.sosBadge}>
                            <Text style={styles.sosText}>SOS</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.cardLocation, { color: theme.textSecondary }]}>📍 {req.location}</Text>
                    </View>
                    
                    <View style={styles.bloodCircle}>
                      <Text style={styles.bloodText}>{req.blood_type}</Text>
                    </View>
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: theme.backgroundSelected }]}>
                    <Text style={[styles.phoneText, { color: theme.textSecondary }]}>📞 {req.contact_number}</Text>
                    <TouchableOpacity
                      style={styles.respondButton}
                      onPress={() => handleRespond(req.contact_number, req.first_name)}
                    >
                      <Text style={styles.respondButtonText}>Respond</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Compatibility Tips */}
          <View style={[styles.tipsSection, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
            <Text style={[styles.tipsTitle, { color: theme.text }]}>Compatibility Guide</Text>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>• O- is the Universal Donor: Can donate to any blood type.</Text>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>• AB+ is the Universal Recipient: Can receive from any blood type.</Text>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>• Always wait 56 days between consecutive whole blood donations.</Text>
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
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  heartIcon: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
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
  loader: {
    marginVertical: 40,
  },
  cardsContainer: {
    gap: Spacing.four,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  emergencyCard: {
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  regularCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sosBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sosText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  cardLocation: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  bloodCircle: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: 'rgba(220, 38, 38, 0.25)',
    borderWidth: 1,
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: Spacing.three,
  },
  phoneText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  respondButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  respondButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tipsSection: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    padding: Spacing.four,
    marginTop: Spacing.six,
    gap: Spacing.two,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
});
