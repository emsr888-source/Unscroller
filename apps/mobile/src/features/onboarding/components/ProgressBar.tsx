import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface ProgressBarProps {
  progress: number; // 0 - 1
  trackHeight?: number;
}

export function ProgressBar({ progress, trackHeight = 8 }: ProgressBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, progress));
    fillWidth.value = withSpring(trackWidth * clamped, {
      mass: 1,
      damping: 18,
      stiffness: 120,
    });
  }, [fillWidth, progress, trackWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));

  const handleLayoutTrack = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const dynamicTrackStyle = useMemo(
    () => ({ height: trackHeight, borderRadius: trackHeight / 2 }),
    [trackHeight],
  );

  return (
    <View style={[styles.track, dynamicTrackStyle]} onLayout={handleLayoutTrack}>
      <Animated.View style={[styles.fill, animatedStyle, { borderRadius: trackHeight / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#1f2937',
  },
});
