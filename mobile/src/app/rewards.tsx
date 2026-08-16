import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemeContext } from '@/context/theme-context';
import { mobileApi, getCurrentUser } from '@/utils/api';

export default function RewardsScreen() {
  const theme = useTheme();
  const { colorScheme, toggleColorScheme } = useContext(ThemeContext);

  const [user, setUser] = useState<any>(getCurrentUser());
  const [rewards, setRewards] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mobileApi.rewards.get()
      .then(res => setRewards(res))
      .catch(err => console.log('Failed to fetch rewards stats on mobile:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalPoints = rewards?.total_points ?? 45;
  const currentBadge = rewards?.current_badge || 'Bronze';
  const pointsNeeded = rewards?.points_needed ?? 155;
  const nextBadge = rewards?.next_badge || 'Silver';

  const badgesList = [
    { title: 'Bronze Hero', xpNeeded: 50, icon: '🥉', desc: 'Log your 1st blood donation' },
    { title: 'Silver Hero', xpNeeded: 100, icon: '🥈', desc: 'Reach 100 total donation XP' },
    { title: 'Gold Hero', xpNeeded: 200, icon: '🥇', desc: 'Reach 200 total donation XP' },
    { title: 'Platinum Lifesaver', xpNeeded: 400, icon: '🏆', desc: 'Reach 400 total donation XP' },
  ];

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusDot, { backgroundColor: theme.warningGold }]} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>Rewards & Badges</Text>
            </View>
            <TouchableOpacity onPress={toggleColorScheme} style={[styles.themeToggleBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <Text style={{ fontSize: 16 }}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.secondary }]}>GAMIFIED DONATION REWARDS & COMMENDATION BADGES</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} size="large" style={{ marginVertical: 40 }} />
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Total XP Hero Card */}
            <View style={[styles.xpCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
              <View style={{ gap: 4 }}>
                <Text style={[styles.xpLabel, { color: theme.textSecondary }]}>TOTAL REWARD POINTS</Text>
                <Text style={[styles.xpValue, { color: theme.text }]}>{totalPoints} XP</Text>
              </View>
              <View style={[styles.badgeBadge, { backgroundColor: 'rgba(255, 0, 51, 0.15)', borderColor: 'rgba(255, 0, 51, 0.3)' }]}>
                <Text style={[styles.badgeText, { color: theme.primary }]}>🏅 {currentBadge}</Text>
              </View>
            </View>

            {/* Next Badge Progress Card */}
            {pointsNeeded > 0 && (
              <View style={[styles.progressCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                <Text style={[styles.progressTitle, { color: theme.text }]}>Next Milestone: {nextBadge}</Text>
                <Text style={[styles.progressSub, { color: theme.textSecondary }]}>Earn {pointsNeeded} more points to unlock your next tier badge!</Text>
                <View style={[styles.progressBarBg, { backgroundColor: theme.backgroundDim }]}>
                  <View style={[styles.progressBarFill, { backgroundColor: theme.primaryNeon, width: `${Math.min(100, (totalPoints / (totalPoints + pointsNeeded)) * 100)}%` }]} />
                </View>
              </View>
            )}

            {/* Certificate Preview Card */}
            <View style={[styles.certCard, { backgroundColor: theme.backgroundElement, borderColor: theme.secondary }]}>
              <Text style={[styles.certHeader, { color: theme.secondary }]}>📜 DIGITAL COMMENDATION CERTIFICATE</Text>
              <Text style={[styles.certBody, { color: theme.text }]}>
                "This certificate is proudly presented to <Text style={{ color: theme.secondary, fontWeight: 'bold' }}>{user?.username || 'Hero Donor'}</Text> in recognition of outstanding biological blood contribution and emergency response support."
              </Text>
              <View style={[styles.certFooter, { borderTopColor: theme.backgroundSelected }]}>
                <Text style={[styles.certBadgeText, { color: theme.bioGreen }]}>✓ Certified by BloodHero Registry</Text>
                <Text style={[styles.certDateText, { color: theme.textSecondary }]}>{new Date().toLocaleDateString()}</Text>
              </View>
            </View>

            {/* Badge Tier Levels List */}
            <View style={{ gap: 12 }}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>🏆 BADGE TIER MATRIX</Text>

              {badgesList.map((badge, idx) => {
                const unlocked = totalPoints >= badge.xpNeeded;
                return (
                  <View key={idx} style={[styles.tierRow, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }, unlocked && { borderColor: 'rgba(0, 255, 148, 0.4)' }]}>
                    <Text style={{ fontSize: 26 }}>{badge.icon}</Text>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.tierTitle, { color: theme.text }]}>{badge.title}</Text>
                      <Text style={[styles.tierDesc, { color: theme.textSecondary }]}>{badge.desc}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: theme.backgroundDim, borderColor: theme.backgroundSelected }, unlocked && { backgroundColor: 'rgba(0, 255, 148, 0.15)', borderColor: 'rgba(0, 255, 148, 0.4)' }]}>
                      <Text style={[styles.statusPillText, { color: unlocked ? theme.bioGreen : theme.textSecondary }]}>
                        {unlocked ? 'UNLOCKED' : `${badge.xpNeeded} XP`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
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
  xpCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  xpValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  badgeBadge: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeText: {
    fontWeight: '900',
    fontSize: 14,
  },
  progressCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  progressSub: {
    fontSize: 11,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  certCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  certHeader: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  certBody: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  certFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  certBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  certDateText: {
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tierRow: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  tierDesc: {
    fontSize: 10,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
  },
});
