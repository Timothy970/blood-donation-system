import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Linking, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemeContext } from '@/context/theme-context';
import { mobileApi, BloodRequest } from '@/utils/api';

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
    created_at: new Date().toISOString(),
    expires_at: new Date().toISOString(),
  },
  {
    id: 2,
    first_name: 'Esther',
    last_name: 'Wanjiku',
    blood_type: 'AB+',
    contact_number: '+254789101112',
    location: 'Aga Khan Medical Center',
    is_emergency: true,
    created_at: new Date().toISOString(),
    expires_at: new Date().toISOString(),
  },
  {
    id: 3,
    first_name: 'Michael',
    last_name: 'Otieno',
    blood_type: 'A+',
    contact_number: '+254755566677',
    location: 'Mombasa Coast Hospital',
    is_emergency: false,
    created_at: new Date().toISOString(),
    expires_at: new Date().toISOString(),
  }
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useContext(ThemeContext);
  const [requests, setRequests] = useState<BloodRequest[]>(MOCK_ALERTS);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await mobileApi.requests.list();
      if (data && data.length > 0) {
        setRequests(data);
      }
    } catch (err) {
      console.log('Using local mock data fallback. Backend request failed:', err);
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
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={[styles.detailsButton, { backgroundColor: theme.backgroundSelected }]}
                        onPress={() => setSelectedRequest(req)}
                      >
                        <Text style={[styles.detailsButtonText, { color: theme.text }]}>Details</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.respondButton}
                        onPress={() => handleRespond(req.contact_number, req.first_name)}
                      >
                        <Text style={styles.respondButtonText}>Respond</Text>
                      </TouchableOpacity>
                    </View>
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

      {/* Detailed View Modal */}
      {selectedRequest && (
        <Modal
          visible={selectedRequest !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedRequest(null)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedRequest(null)}
          >
            <View 
              style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
              onStartShouldSetResponder={() => true}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>
                      {selectedRequest.first_name} {selectedRequest.last_name}
                    </Text>
                    {selectedRequest.is_emergency && (
                      <View style={styles.sosBadge}>
                        <Text style={styles.sosText}>SOS</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Active Emergency Broadcast</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedRequest(null)} style={styles.closeButton}>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Blood Type Info */}
              <View style={styles.modalBloodSection}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalSectionLabel, { color: theme.textSecondary }]}>REQUIRED BLOOD TYPE</Text>
                  <Text style={[styles.modalSectionDesc, { color: theme.textSecondary }]}>Compatible donors, please respond</Text>
                </View>
                <View style={styles.modalBloodCircle}>
                  <Text style={styles.modalBloodCircleText}>{selectedRequest.blood_type}</Text>
                </View>
              </View>

              {/* Location & Coordinates */}
              <View style={[styles.modalInfoBox, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
                <Text style={[styles.modalSectionLabel, { color: theme.textSecondary }]}>LOCATION & DIRECTIONS</Text>
                <Text style={[styles.modalInfoVal, { color: theme.text, marginTop: 4 }]}>📍 {selectedRequest.location}</Text>
                
                {selectedRequest.latitude && selectedRequest.longitude ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                      GPS: {selectedRequest.latitude.toFixed(6)}, {selectedRequest.longitude.toFixed(6)}
                    </Text>
                    <TouchableOpacity
                      style={[styles.mapsButton, { backgroundColor: theme.backgroundSelected }]}
                      onPress={() => {
                        const url = `https://www.google.com/maps/search/?api=1&query=${selectedRequest.latitude},${selectedRequest.longitude}`;
                        Linking.openURL(url);
                      }}
                    >
                      <Text style={[styles.mapsButtonText, { color: theme.text }]}>🗺 View on Google Maps</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic', marginTop: 6 }}>
                    No GPS coordinates logged for this alert.
                  </Text>
                )}
              </View>

              {/* Contact Details */}
              <View style={[styles.modalInfoBox, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
                <Text style={[styles.modalSectionLabel, { color: theme.textSecondary }]}>CONTACT NUMBER</Text>
                <Text style={[styles.modalInfoVal, { color: theme.text, marginTop: 4 }]}>📞 {selectedRequest.contact_number}</Text>
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.chatButton, { backgroundColor: theme.backgroundSelected }]}
                  onPress={() => {
                    if (!selectedRequest.requester_id) {
                      alert('This request was submitted as a guest and does not support in-app chat.');
                      return;
                    }
                    
                    const reqId = selectedRequest.requester_id;
                    setSelectedRequest(null);
                    
                    // Navigate to chat tab passing other_id
                    router.push(`/chat?other_id=${reqId}`);
                  }}
                >
                  <Text style={[styles.chatButtonText, { color: theme.text }]}>💬 Chat In-App</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalRespondButton}
                  onPress={() => {
                    handleRespond(selectedRequest.contact_number, selectedRequest.first_name);
                  }}
                >
                  <Text style={styles.modalRespondButtonText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
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
  detailsButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  modalBloodSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.15)',
    borderRadius: 16,
    padding: Spacing.three,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  modalSectionDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  modalBloodCircle: {
    backgroundColor: '#dc2626',
    borderRadius: 16,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBloodCircleText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalInfoBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
  },
  modalInfoVal: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  mapsButton: {
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  mapsButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  chatButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalRespondButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRespondButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
