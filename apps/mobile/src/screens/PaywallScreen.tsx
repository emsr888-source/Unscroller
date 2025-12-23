import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, Pressable, ActivityIndicator, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useAppStore } from '@/store';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { COLORS } from '@/core/theme/colors';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { SPACING } from '@/core/theme/spacing';
import SubscriptionService, { SubscriptionPlanId, SubscriptionProduct } from '@/services/subscription';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

interface PlanOption {
  id: SubscriptionPlanId;
  title: string;
  caption: string;
  price: string;
  billingDetail: string;
  discountLabel: string;
  description: string;
  compareAt?: string;
  highlight?: string;
}

interface TimelineStep {
  id: string;
  title: string;
  detail: string;
  accent: string;
  icon: string;
  topConnectorColor: string;
  bottomConnectorColor: string;
}

const FALLBACK_PLAN_OPTIONS: PlanOption[] = [
  {
    id: 'monthly',
    title: 'Monthly',
    caption: '',
    price: '$12.99/mo',
    billingDetail: '$12.99 billed monthly',
    discountLabel: '',
    description: '',
  },
  {
    id: 'annual',
    title: 'Yearly',
    caption: '',
    price: '$3.33/mo',
    billingDetail: '$39.99 billed annually',
    discountLabel: '3 DAYS FREE',
    description: '',
    highlight: 'Best deal',
  },
];

const CTA_LABEL = 'Start My 3-Day Free Trial';

export default function PaywallScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>('annual');
  const setSubscription = useAppStore(state => state.setSubscription);
  const user = useAppStore(state => state.user);

  const planOptions = useMemo<PlanOption[]>(() => {
    if (!products.length) {
      return FALLBACK_PLAN_OPTIONS;
    }

    return FALLBACK_PLAN_OPTIONS.map(option => {
      const product = products.find(current => current.productId === SubscriptionService.getProductId(option.id));
      if (!product) {
        return option;
      }

      const price = product.price || option.price;
      const billingDetail = product.subscriptionPeriodUnitIOS
        ? `Renews ${product.subscriptionPeriodUnitIOS.toLowerCase()}`
        : option.billingDetail;

      return {
        ...option,
        price,
        billingDetail,
      };
    });
  }, [products]);

  const timelineSteps = useMemo<TimelineStep[]>(() => {
    const billingDate = new Date();
    billingDate.setDate(billingDate.getDate() + 3);
    const billingDateLabel = billingDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return [
      {
        id: 'today',
        title: 'Today',
        detail: "Unlock all the app's features like AI calorie scanning and more.",
        accent: '#F59E0B',
        icon: '🔓',
        topConnectorColor: 'transparent',
        bottomConnectorColor: '#F59E0B',
      },
      {
        id: 'reminder',
        title: 'In 2 Days - Reminder',
        detail: "We'll send you a reminder that your trial is ending soon.",
        accent: '#F59E0B',
        icon: '🔔',
        topConnectorColor: '#F59E0B',
        bottomConnectorColor: '#9CA3AF',
      },
      {
        id: 'billing',
        title: 'In 3 Days - Billing Starts',
        detail: `You'll be charged on ${billingDateLabel} unless you cancel anytime before.`,
        accent: '#0F0F0F',
        icon: '🏁',
        topConnectorColor: '#9CA3AF',
        bottomConnectorColor: 'transparent',
      },
    ];
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        await SubscriptionService.initialize();
        if (!SubscriptionService.isConfigured()) {
          Alert.alert(
            'Subscriptions unavailable',
            'Subscription products are not configured. Please contact support.',
          );
          return;
        }

        const fetchedProducts = await SubscriptionService.getAvailableProducts();
        if (isMounted && fetchedProducts.length) {
          setProducts(fetchedProducts);
        }
      } catch (error) {
        if (isMounted) {
          console.warn('[Paywall] Failed to initialize purchases:', error);
          Alert.alert(
            'Purchases unavailable',
            'We could not connect to the purchase service. Please try again later.',
          );
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      SubscriptionService.endConnection().catch(() => undefined);
    };
  }, []);

  const setActiveSubscription = (plan: SubscriptionPlanId) => {
    const days = plan === 'annual' ? 365 : 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    setSubscription({
      status: 'active',
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      expiresAt,
    });
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const plan = selectedPlan;
      await SubscriptionService.purchasePlan(plan);
      setActiveSubscription(plan);
      Alert.alert('Success', 'Your subscription is now active.');
      navigation.replace('Home');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to complete purchase right now.';
      console.error('[Paywall] Purchase failed', { error: message });
      Alert.alert('Purchase failed', message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (user) {
      SubscriptionService.initialize().catch(() => undefined);
    }
  }, [user]);

  return (
    <ScreenWrapper edges={['bottom']} contentStyle={styles.screenWrapperContent}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      {isInitializing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.ACCENT_GRADIENT_END} />
          <Text style={styles.loadingText}>Preparing subscriptions…</Text>
        </View>
      ) : (
        <View style={styles.page}>
          <View style={styles.topBar}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button">
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.timelineBlock}>
              <Text style={styles.headline}>Start your 3-day FREE trial to continue.</Text>

              <View style={styles.timeline}>
                <View style={styles.timelineTrack} />
                {timelineSteps.map(step => (
                  <View key={step.id} style={styles.timelineRow}>
                    <View style={styles.timelineIconColumn}>
                      <View
                        style={[
                          styles.timelineConnectorSegment,
                          step.topConnectorColor === 'transparent' && styles.timelineConnectorHidden,
                          { backgroundColor: step.topConnectorColor },
                        ]}
                      />
                      <View style={[styles.timelineIconBubble, { backgroundColor: step.accent }]}>
                        <Text style={styles.timelineIcon}>{step.icon}</Text>
                      </View>
                      <View
                        style={[
                          styles.timelineConnectorSegment,
                          step.bottomConnectorColor === 'transparent' && styles.timelineConnectorHidden,
                          { backgroundColor: step.bottomConnectorColor },
                        ]}
                      />
                    </View>
                    <View style={styles.timelineCopy}>
                      <Text style={styles.timelineTitle}>{step.title}</Text>
                      <Text style={styles.timelineDetail}>{step.detail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.ctaBar}>
            <View style={styles.planRow}>
              {planOptions.map(plan => {
                const isSelected = plan.id === selectedPlan;
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => setSelectedPlan(plan.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.planCard, isSelected ? styles.planCardSelected : styles.planCardDefault]}
                  >
                    {plan.id === 'annual' ? (
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>3 DAYS FREE</Text>
                      </View>
                    ) : null}
                    <View style={styles.planCardHeader}>
                      <View>
                        <Text style={styles.planLabel}>{plan.title}</Text>
                        <Text style={styles.planPrice}>{plan.price}</Text>
                      </View>
                    </View>
                    <View style={[styles.radioOuter, isSelected ? styles.radioOuterSelected : styles.radioOuterDefault]}>
                      {isSelected ? <Text style={styles.radioCheck}>✓</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.noPaymentRow}>
              <Text style={styles.noPaymentText}>✓ No Payment Due Now</Text>
            </View>
            <Pressable
              style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
              onPress={handlePurchase}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.ctaButtonText}>{CTA_LABEL}</Text>}
            </Pressable>
            <Text style={styles.footnote}>3 days free, then $39.99 per year ($3.33/mo).</Text>
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screenWrapperContent: {
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.space_3,
  },
  loadingText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
  },
  page: {
    flex: 1,
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_7,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: SPACING.space_5,
  },
  backButton: {
    paddingVertical: SPACING.space_1,
    paddingRight: SPACING.space_2,
  },
  backIcon: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
  },
  restoreLink: {
    ...TYPOGRAPHY.Body,
    color: '#9CA3AF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: SPACING.space_1,
    paddingBottom: SPACING.space_6,
    gap: SPACING.space_4,
  },
  timelineBlock: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    alignItems: 'center',
    gap: SPACING.space_4,
  },
  headline: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: SPACING.space_2,
  },
  timeline: {
    width: '100%',
    marginTop: SPACING.space_2,
    gap: SPACING.space_3,
    position: 'relative',
    paddingLeft: 16,
  },
  timelineTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 26,
    width: 8,
    borderRadius: 8,
    backgroundColor: '#FCD34D',
    opacity: 0.35,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: SPACING.space_4,
    alignItems: 'stretch',
  },
  timelineIconColumn: {
    width: 48,
    alignItems: 'center',
  },
  timelineConnectorSegment: {
    width: 6,
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
  },
  timelineConnectorHidden: {
    opacity: 0,
  },
  timelineIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.space_1 / 2,
  },
  timelineIcon: {
    fontSize: 20,
  },
  timelineCopy: {
    flex: 1,
  },
  timelineTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  timelineDetail: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    lineHeight: 20,
  },
  planRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    width: '100%',
  },
  planCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 2,
    paddingVertical: SPACING.space_4,
    paddingHorizontal: SPACING.space_3,
    position: 'relative',
    gap: SPACING.space_2,
    minHeight: 132,
    justifyContent: 'space-between',
  },
  planCardDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  planCardMonthly: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  planCardYearly: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  planCardSelected: {
    borderColor: '#0F0F0F',
    backgroundColor: '#FFFFFF',
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLabel: {
    ...TYPOGRAPHY.Body,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  planBadge: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#0F0F0F',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: 6,
    zIndex: 2,
  },
  planBadgeText: {
    ...TYPOGRAPHY.Subtext,
    color: '#FFFFFF',
    letterSpacing: 1,
    fontSize: 11,
  },
  planPrice: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
  },
  radioOuter: {
    position: 'absolute',
    top: SPACING.space_3,
    right: SPACING.space_3,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioOuterDefault: {
    borderColor: '#D1D5DB',
  },
  radioOuterYearly: {
    backgroundColor: '#1C1C1C',
    borderColor: '#FFFFFF',
  },
  radioOuterSelected: {
    borderColor: '#0F0F0F',
    backgroundColor: '#0F0F0F',
  },
  radioCheck: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  radioCheckOnDark: {
    color: '#0F0F0F',
  },
  noPaymentRow: {
    alignItems: 'center',
    marginBottom: SPACING.space_2,
  },
  noPaymentText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'none',
  },
  footnote: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  ctaBar: {
    paddingTop: SPACING.space_3,
    paddingBottom: SPACING.space_5,
    gap: SPACING.space_3,
  },
  ctaButton: {
    backgroundColor: '#0F0F0F',
    borderRadius: 32,
    paddingVertical: SPACING.space_3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    ...TYPOGRAPHY.H4,
    color: '#FFFFFF',
  },
});
