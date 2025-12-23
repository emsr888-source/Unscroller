import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, Share } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Referrals'>;

export default function ReferralsScreen({ navigation: _navigation }: Props) {
  const referralCode = 'BUILD247';
  const referralsCount = 3;
  const bonusDays = 15;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Unscroller! Let's build our dreams together. Use code ${referralCode} for 7 days free. unscroller.app`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyCode = () => {
    // TODO: Copy to clipboard
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Referrals</Text>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>🎁</Text>
          <Text style={styles.heroTitle}>Invite Friends,{'\n'}Get Rewards</Text>
          <Text style={styles.heroSubtitle}>Give 7 days free. Get 5 days free for each friend who joins.</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{referralsCount}</Text>
            <Text style={styles.statLabel}>Friends Joined</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{bonusDays}</Text>
            <Text style={styles.statLabel}>Bonus Days</Text>
          </View>
        </View>

        <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeCard}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <WatercolorButton color="neutral" onPress={handleCopyCode} style={styles.copyButton}>
              <Text style={styles.copyText}>Copy</Text>
            </WatercolorButton>
          </View>
        </View>

        <View style={styles.shareCard}>
          <WatercolorButton color="blue" onPress={handleShare}>
            <Text style={styles.shareText}>Share with Friends</Text>
          </WatercolorButton>
        </View>

        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>

          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Share Your Code</Text>
                <Text style={styles.stepDescription}>Send your code to friends who want to build.</Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>They Get 7 Days Free</Text>
                <Text style={styles.stepDescription}>Full access to all features, no credit card needed.</Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>You Get 5 Days Free</Text>
                <Text style={styles.stepDescription}>For each friend who joins and stays active.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>🌟 Build Together</Text>
          <Text style={styles.benefitsText}>
            Refer 6 friends = 1 month free{'\n'}
            Refer 12 friends = 2 months free{'\n'}
            Help others transform while growing your own streak!
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_4,
    paddingBottom: SPACING.space_3,
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.space_5,
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_2,
  },
  heroIcon: { fontSize: 48 },
  heroTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: SPACING.space_4,
    borderRadius: 16,
    padding: SPACING.space_4,
    borderWidth: 2,
    borderColor: '#1f2937',
    marginBottom: SPACING.space_4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: SPACING.space_1,
  },
  statNumber: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  statLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  divider: {
    width: 1,
    marginHorizontal: SPACING.space_3,
    backgroundColor: '#d4d4d8',
    alignSelf: 'stretch',
  },
  codeSection: {
    paddingHorizontal: SPACING.space_4,
    marginBottom: SPACING.space_4,
    gap: SPACING.space_2,
  },
  codeLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#64748b',
  },
  codeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: SPACING.space_4,
    borderWidth: 2,
    borderColor: '#1f2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.space_3,
  },
  codeText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  copyButton: {
    minWidth: 80,
  },
  copyText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  shareCard: {
    paddingHorizontal: SPACING.space_4,
    marginBottom: SPACING.space_4,
  },
  shareText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  howItWorksSection: {
    paddingHorizontal: SPACING.space_4,
    gap: SPACING.space_3,
    marginBottom: SPACING.space_4,
  },
  sectionTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  stepsList: {
    gap: SPACING.space_3,
  },
  stepItem: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    alignItems: 'center',
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  stepContent: {
    flex: 1,
    gap: SPACING.space_1,
  },
  stepTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  stepDescription: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  benefitsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: SPACING.space_4,
    borderWidth: 2,
    borderColor: '#1f2937',
    marginHorizontal: SPACING.space_4,
    gap: SPACING.space_2,
    marginBottom: SPACING.space_5,
  },
  benefitsTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  benefitsText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#64748b',
    lineHeight: 22,
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
