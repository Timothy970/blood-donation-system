import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemeContext } from '@/context/theme-context';

export default function ExploreScreen() {
  const theme = useTheme();
  const { colorScheme, toggleColorScheme } = useContext(ThemeContext);
  
  // Mock Active User state for previewing
  const [donor, setDonor] = useState({
    username: 'Timothy Kimani',
    blood_type: 'O-',
    city: 'Nairobi',
    phone_number: '+254712345678',
    is_eligible: true,
    last_donation: '2026-04-10',
  });

  // Calculate cooling down period
  const getCooldownDays = () => {
    const lastDate = new Date(donor.last_donation);
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
        // Form corners and random blocks
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

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Digital Donor Card</Text>
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
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Present card at clinics to log donations instantly</Text>
        </View>

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
                  <Text style={styles.cardName}>{donor.username}</Text>
                </View>
                <View style={styles.bloodBadge}>
                  <Text style={styles.bloodText}>{donor.blood_type}</Text>
                </View>
              </View>

              <View style={styles.cardMid}>
                <View>
                  <Text style={styles.infoLabel}>CITY</Text>
                  <Text style={styles.infoValue}>{donor.city}</Text>
                </View>
                <View>
                  <Text style={styles.infoLabel}>PHONE</Text>
                  <Text style={styles.infoValue}>{donor.phone_number}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.verifiedText}>✓ Verified Digital Record</Text>
                <Text style={styles.logoText}>♥</Text>
              </View>
            </View>
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
                : `You recently donated on ${donor.last_donation}. Please wait another ${cooldownDays} days before booking your next appointment.`
              }
            </Text>
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
  qrBox: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 24,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.four,
  },
  qrLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  qrContainer: {
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  qrRow: {
    flexDirection: 'row',
  },
  qrPixel: {
    width: 10,
    height: 10,
  },
  qrDesc: {
    color: '#64748b',
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
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
});
