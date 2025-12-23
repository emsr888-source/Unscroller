import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated as RNAnimated, Pressable, Platform } from 'react-native';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, Easing as ReanimatedEasing } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import logoImage from '../../../../icon.png';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingReflection'>;

export default function OnboardingReflectionScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const [isReady, setIsReady] = useState(false);
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const logoScale = useRef(new RNAnimated.Value(0.8)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const captionProgress = useSharedValue(0);
  const textAnimations = useMemo(() => [new RNAnimated.Value(0), new RNAnimated.Value(0)], []);
  const captionStyle = useAnimatedStyle(() => ({
    opacity: captionProgress.value,
    transform: [
      {
        translateY: (1 - captionProgress.value) * 10,
      },
    ],
  }));

  const handleSkip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    navigation.replace('OnboardingWelcome');
  }, [navigation]);

  useEffect(() => {
    RNAnimated.sequence([
      RNAnimated.parallel([
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        RNAnimated.spring(logoScale, {
          toValue: 1,
          tension: 30,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      RNAnimated.stagger(
        300,
        textAnimations.map(anim =>
          RNAnimated.timing(anim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          })
        )
      ),
    ]).start(({ finished }) => {
      if (!finished) {
        return;
      }
      captionProgress.value = withTiming(1, {
        duration: 350,
        easing: ReanimatedEasing.out(ReanimatedEasing.quad),
      });
      
      // Enable interaction after all animations complete
      setTimeout(() => {
        setIsReady(true);
      }, 400);
    });

    // Auto-navigate after a longer pause so the moment can land
    timeoutRef.current = setTimeout(() => {
      handleSkip();
    }, 6000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [handleSkip]);

  return (
    <View style={styles.root}>
      <StatusBar animated={true} barStyle="dark-content" backgroundColor="#fdfbf7" hidden={false} />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <WatercolorCard style={styles.card} backgroundColor="#fffef9" padding={SPACING.space_5}>
            <Pressable 
              style={styles.cardContent} 
              onPress={isReady ? handleSkip : undefined}
              disabled={!isReady}
            >
              <RNAnimated.View
                style={[
                  styles.logoHalo,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: logoScale }],
                  },
                ]}
              />

              <RNAnimated.Image
                source={logoImage}
                resizeMode="contain"
                style={[
                  styles.logoImage,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: logoScale }],
                  },
                ]}
                accessibilityLabel="Unscroller logo"
              />

              <View style={styles.textStack}>
                {HEADLINES.map((line, index) => (
                  <RNAnimated.Text
                    key={line.id}
                    style={[
                      styles.headline,
                      index === 1 && styles.subline,
                      {
                        opacity: textAnimations[index],
                        transform: [
                          {
                            translateY: textAnimations[index].interpolate({
                              inputRange: [0, 1],
                              outputRange: [16, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {line.copy}
                  </RNAnimated.Text>
                ))}
              </View>

              <Reanimated.View style={[styles.captionContainer, captionStyle, !isReady && styles.captionDisabled]}>
                <Text style={styles.caption}>
                  {isReady ? 'Tap anywhere to continue →' : 'Loading...'}
                </Text>
              </Reanimated.View>
            </Pressable>
          </WatercolorCard>
        </View>
      </SafeAreaView>
    </View>
  );
}

const HEADLINES = [
  { id: 'create', copy: 'Create the life of your dreams.' },
  { id: 'build', copy: 'Stop consuming others. Start building yours.' },
];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_4,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
  },
  cardContent: {
    width: '100%',
    alignItems: 'center',
  },
  logoHalo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.2,
    shadowRadius: 30,
  },
  logoImage: {
    width: 160,
    height: 160,
    marginBottom: SPACING.space_5,
  },
  textStack: {
    gap: SPACING.space_2,
    alignItems: 'center',
  },
  headline: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 40,
  },
  subline: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#475569',
  },
  captionContainer: {
    marginTop: SPACING.space_5,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fef3c7',
  },
  caption: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
    textAlign: 'center',
  },
  captionDisabled: {
    opacity: 0.5,
  },
});
