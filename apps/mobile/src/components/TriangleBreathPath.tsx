import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import type { BreathPhaseSpec } from '@/features/reset/types';

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

interface TriangleBreathPathProps {
  cycleProgress: number; // 0-1 for entire breath cycle
  currentPhase: 'inhale' | 'hold' | 'exhale' | 'rest';
  phases: BreathPhaseSpec[]; // Actual breath phases from preset
  width?: number;
  height?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const DEFAULT_WIDTH = Math.min(SCREEN_WIDTH - 80, 320);
const DEFAULT_HEIGHT = DEFAULT_WIDTH * 0.85;

export default function TriangleBreathPath({
  cycleProgress,
  currentPhase,
  phases,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}: TriangleBreathPathProps) {
  const ballProgress = useSharedValue(0);

  // Calculate phase boundaries based on actual phase durations
  const phaseBoundaries = React.useMemo(() => {
    const totalDuration = phases.reduce((sum, p) => sum + p.durationMs, 0);
    let cumulative = 0;
    const boundaries: { type: string; start: number; end: number }[] = [];
    
    phases.forEach((phase) => {
      const start = cumulative / totalDuration;
      cumulative += phase.durationMs;
      const end = cumulative / totalDuration;
      boundaries.push({ type: phase.type, start, end });
    });
    
    return boundaries;
  }, [phases]);

  useEffect(() => {
    // Use the cumulative cycle progress directly (0-1 for entire breath cycle)
    // This prevents the ball from restarting at phase changes
    ballProgress.value = cycleProgress;
  }, [cycleProgress, ballProgress]);

  // Triangle path points
  const padding = 20;
  const bottomLeftX = padding;
  const bottomLeftY = height - padding - 20;
  const topCenterX = width / 2;
  const topCenterY = padding + 80;
  const bottomRightX = width - padding;
  const bottomRightY = height - padding - 20;

  // Create triangle path
  const trianglePath = `
    M ${bottomLeftX} ${bottomLeftY}
    L ${topCenterX - 30} ${topCenterY}
    L ${topCenterX + 30} ${topCenterY}
    L ${bottomRightX} ${bottomRightY}
  `;

  // Calculate ball position along path
  const animatedBallProps = useAnimatedProps(() => {
    const progress = ballProgress.value;
    
    let cx = bottomLeftX;
    let cy = bottomLeftY;
    
    // Find which segment we're in and map proportionally
    // Three segments of triangle: left side (inhale), top flat (hold_after_inhale only), right side (exhale)
    let inSegment = 0;
    let holdSegment = 0;
    
    // Calculate segment boundaries based on phase types
    for (let i = 0; i < phaseBoundaries.length; i++) {
      const boundary = phaseBoundaries[i];
      if (boundary.type === 'inhale') {
        inSegment = boundary.end;
      } else if (boundary.type === 'hold_after_inhale') {
        // Only hold_after_inhale goes on the flat top
        holdSegment = boundary.end;
      }
    }
    
    // If no hold_after_inhale, skip the hold segment (go straight from inhale to exhale)
    if (holdSegment === 0 || holdSegment === inSegment) {
      holdSegment = inSegment;
    }
    
    // Find where exhale ends (before any hold_after_exhale)
    let exSegment = 1.0;
    for (let i = 0; i < phaseBoundaries.length; i++) {
      const boundary = phaseBoundaries[i];
      if (boundary.type === 'exhale') {
        exSegment = boundary.end;
      }
    }
    
    if (progress <= inSegment && inSegment > 0) {
      // Inhale: bottom left to top left
      const t = progress / inSegment;
      cx = interpolate(t, [0, 1], [bottomLeftX, topCenterX - 30], Extrapolate.CLAMP);
      cy = interpolate(t, [0, 1], [bottomLeftY, topCenterY], Extrapolate.CLAMP);
    } else if (progress <= holdSegment) {
      // Hold: move horizontally across top plateau (only hold_after_inhale)
      const t = holdSegment > inSegment ? (progress - inSegment) / (holdSegment - inSegment) : 0;
      cx = interpolate(t, [0, 1], [topCenterX - 30, topCenterX + 30], Extrapolate.CLAMP);
      cy = topCenterY;
    } else if (progress <= exSegment) {
      // Exhale: top right to bottom right (excludes hold_after_exhale)
      const t = (progress - holdSegment) / (exSegment - holdSegment);
      cx = interpolate(t, [0, 1], [topCenterX + 30, bottomRightX], Extrapolate.CLAMP);
      cy = interpolate(t, [0, 1], [topCenterY, bottomRightY], Extrapolate.CLAMP);
    } else {
      // hold_after_exhale or rest - stay at bottom right
      cx = bottomRightX;
      cy = bottomRightY;
    }
    
    return { cx, cy };
  });

  const instructionText =
    currentPhase === 'inhale'
      ? 'Breathe in\nwhen the ball goes up'
      : currentPhase === 'hold'
      ? 'Hold\nwhile the ball moves across'
      : currentPhase === 'exhale'
      ? 'Breathe out\nwhen it goes down'
      : 'Breathe';

  return (
    <View style={[styles.container, { width, height: height + 100 }]}>
      <Text style={styles.instructionText}>{instructionText}</Text>
      
      <Svg width={width} height={height} style={styles.svg}>
        {/* Triangle path outline */}
        <Path
          d={trianglePath}
          stroke="#60a5fa"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Animated ball */}
        <AnimatedSvgCircle
          r={16}
          fill="#fbbf24"
          animatedProps={animatedBallProps}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
    paddingHorizontal: 16,
  },
  svg: {
    overflow: 'visible',
  },
});
