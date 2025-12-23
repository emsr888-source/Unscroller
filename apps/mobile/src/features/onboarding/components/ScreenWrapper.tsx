import React, { PropsWithChildren } from 'react';
import { ImageBackground, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BRANDING } from '@/assets/branding';
import { COLORS } from '@/core/theme/colors';

interface ScreenWrapperProps extends PropsWithChildren {
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

export function ScreenWrapper({ children, edges = ['top', 'bottom'], contentStyle }: ScreenWrapperProps) {
  return (
    <View style={styles.root}>
      <ImageBackground
        source={BRANDING.background}
        resizeMode="cover"
        blurRadius={2}
        style={styles.background}
        imageStyle={styles.backgroundImage}
        accessibilityIgnoresInvertColors
      >
        <LinearGradient
          colors={[
            'rgba(245, 235, 221, 0.98)',
            'rgba(245, 235, 221, 0.94)',
          ]}
          style={styles.backgroundOverlay}
          pointerEvents="none"
        />
      </ImageBackground>
      <AnimatedSafeAreaView edges={edges} style={[styles.safeArea, contentStyle]}>
        {children}
      </AnimatedSafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    opacity: 0,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.BACKGROUND_MAIN,
    opacity: 1,
  },
  safeArea: {
    flex: 1,
  },
});
