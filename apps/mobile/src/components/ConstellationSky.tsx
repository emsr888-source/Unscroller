import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import type { Star, SkyState } from '@/services/constellationService.database';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_RENDERED_STARS = 180;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const hashString = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

type NebulaConfig = {
  colors: [string, string];
  size: number;
  topRatio: number;
  leftRatio: number;
  opacity: number;
  rotation: number;
  duration?: number;
  delay?: number;
};

type UniverseTheme = {
  id: string;
  label: string;
  description: string;
  gradient: [string, string, ...string[]];
  starPalette: string[];
  haloColors: [string, string];
  nebulae: NebulaConfig[];
  shootingStarColor: string;
  trailColor: string;
};

export type UniverseStage = {
  level: number;
  label: string;
  description: string;
  theme: UniverseTheme;
  scale: number;
  twinkleRange: [number, number];
  starDensity: number;
  energy: number;
  completedConstellations: number;
  totalStars: number;
};

const UNIVERSE_THEMES: UniverseTheme[] = [
  {
    id: 'dawn',
    label: 'Starlit Dawn',
    description: 'Your universe is just waking up—keep stacking wins to paint the cosmos.',
    gradient: ['#04020f', '#111537', '#1b1f4f'],
    starPalette: ['#FFFFFF', '#FFE6F4', '#D3F0FF'],
    haloColors: ['rgba(86, 61, 220, 0.22)', 'rgba(10, 3, 30, 0.0)'],
    nebulae: [
      {
        colors: ['rgba(100, 64, 255, 0.45)', 'rgba(20, 12, 60, 0)'],
        size: 420,
        topRatio: -0.12,
        leftRatio: -0.25,
        opacity: 0.55,
        rotation: -18,
      },
      {
        colors: ['rgba(49, 173, 255, 0.38)', 'rgba(7, 9, 30, 0)'],
        size: 360,
        topRatio: 0.62,
        leftRatio: 0.58,
        opacity: 0.4,
        rotation: 12,
      },
    ],
    shootingStarColor: '#F6F3FF',
    trailColor: 'rgba(182, 157, 255, 0.35)',
  },
  {
    id: 'nebula-rise',
    label: 'Nebula Rise',
    description: 'Constellations are forming—your universe glows brighter with each challenge.',
    gradient: ['#050112', '#1c0f38', '#351d63'],
    starPalette: ['#FFFFFF', '#FDD8FF', '#C0F1FF', '#FFE8C3'],
    haloColors: ['rgba(147, 87, 255, 0.3)', 'rgba(10, 12, 35, 0)'],
    nebulae: [
      {
        colors: ['rgba(220, 105, 255, 0.35)', 'rgba(20, 8, 50, 0)'],
        size: 520,
        topRatio: -0.18,
        leftRatio: 0.18,
        opacity: 0.48,
        rotation: 22,
      },
      {
        colors: ['rgba(72, 201, 255, 0.36)', 'rgba(8, 12, 35, 0)'],
        size: 440,
        topRatio: 0.52,
        leftRatio: -0.22,
        opacity: 0.42,
        rotation: -16,
      },
      {
        colors: ['rgba(255, 147, 220, 0.24)', 'rgba(15, 8, 42, 0)'],
        size: 380,
        topRatio: 0.12,
        leftRatio: 0.62,
        opacity: 0.35,
        rotation: 8,
      },
    ],
    shootingStarColor: '#F2E8FF',
    trailColor: 'rgba(255, 202, 255, 0.4)',
  },
  {
    id: 'stellar-bloom',
    label: 'Stellar Bloom',
    description: 'You’re bending galaxies—each win unlocks new color across the void.',
    gradient: ['#040013', '#220a3b', '#482065', '#63206B'],
    starPalette: ['#FFFFFF', '#FDE8FF', '#C5F5FF', '#FFE39F', '#B7E7FF'],
    haloColors: ['rgba(255, 115, 230, 0.36)', 'rgba(24, 6, 54, 0.0)'],
    nebulae: [
      {
        colors: ['rgba(255, 140, 250, 0.35)', 'rgba(24, 6, 54, 0)'],
        size: 600,
        topRatio: -0.15,
        leftRatio: -0.28,
        opacity: 0.54,
        rotation: -14,
      },
      {
        colors: ['rgba(92, 226, 255, 0.35)', 'rgba(16, 27, 64, 0)'],
        size: 500,
        topRatio: 0.58,
        leftRatio: 0.65,
        opacity: 0.46,
        rotation: 18,
      },
      {
        colors: ['rgba(255, 198, 129, 0.28)', 'rgba(40, 12, 60, 0)'],
        size: 440,
        topRatio: 0.25,
        leftRatio: -0.35,
        opacity: 0.4,
        rotation: 10,
      },
    ],
    shootingStarColor: '#FFE7FF',
    trailColor: 'rgba(255, 168, 255, 0.42)',
  },
  {
    id: 'cosmic-surge',
    label: 'Cosmic Surge',
    description: 'A living universe. Challenges conquered ignite vibrant cosmic storms.',
    gradient: ['#020012', '#140726', '#3a1964', '#6a2494'],
    starPalette: ['#FFFFFF', '#F7D9FF', '#FFE9C9', '#C8F6FF', '#FFB7F3', '#A2E2FF'],
    haloColors: ['rgba(255, 164, 255, 0.4)', 'rgba(35, 5, 75, 0.0)'],
    nebulae: [
      {
        colors: ['rgba(255, 122, 255, 0.4)', 'rgba(20, 6, 65, 0)'],
        size: 720,
        topRatio: -0.22,
        leftRatio: -0.32,
        opacity: 0.6,
        rotation: -10,
        duration: 52000,
      },
      {
        colors: ['rgba(90, 242, 255, 0.35)', 'rgba(12, 24, 62, 0)'],
        size: 620,
        topRatio: 0.6,
        leftRatio: 0.55,
        opacity: 0.52,
        rotation: 20,
        duration: 48000,
      },
      {
        colors: ['rgba(255, 198, 137, 0.32)', 'rgba(25, 8, 60, 0)'],
        size: 540,
        topRatio: 0.18,
        leftRatio: -0.4,
        opacity: 0.45,
        rotation: -6,
        duration: 56000,
      },
      {
        colors: ['rgba(170, 112, 255, 0.3)', 'rgba(17, 10, 50, 0)'],
        size: 500,
        topRatio: -0.05,
        leftRatio: 0.48,
        opacity: 0.4,
        rotation: 14,
        duration: 60000,
      },
    ],
    shootingStarColor: '#FFEFFF',
    trailColor: 'rgba(255, 180, 255, 0.5)',
  },
];

export function getUniverseStage(skyState: SkyState): UniverseStage {
  const totalStars = skyState.totalStars ?? 0;
  const completedConstellations = skyState.constellations.filter(constellation => constellation.completed).length;
  const averageProgress = skyState.constellations.length
    ? skyState.constellations.reduce((sum, constellation) => sum + (constellation.progress ?? 0), 0) /
      (skyState.constellations.length * 100)
    : 0;

  const progressScore = completedConstellations * 1.6 + averageProgress * 2 + Math.min(totalStars, 160) / 45;
  const level = clamp(Math.floor(progressScore), 0, UNIVERSE_THEMES.length - 1);
  const theme = UNIVERSE_THEMES[level];
  const scale = 1 + Math.min(totalStars, 180) / 240;
  const starDensity = 0.85 + level * 0.18 + Math.min(totalStars, 120) / 500;
  const energy = clamp(progressScore / (UNIVERSE_THEMES.length + 1), 0, 1);

  return {
    level,
    label: theme.label,
    description: theme.description,
    theme,
    scale,
    twinkleRange: [0.55 + level * 0.03, 1 + level * 0.12],
    starDensity,
    energy,
    completedConstellations,
    totalStars,
  };
}

const randomInRange = (seed: number, offset: number, min: number, max: number) => {
  const value = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
  const fractional = value - Math.floor(value);
  return min + fractional * (max - min);
};

const getStarColor = (palette: string[], seed: number) => {
  if (!palette.length) {
    return '#ffffff';
  }
  const index = Math.abs(Math.floor(seed)) % palette.length;
  return palette[index];
};

const normalizeStar = (star: Star, seed: number): Star => {
  const normalizedBrightness = clamp(
    star.brightness ?? randomInRange(seed, 4, 0.6, 1),
    0.35,
    1
  );
  const sizeRoll = randomInRange(seed, 5, 0, 1);
  const normalizedSize: Star['size'] =
    star.size ?? (sizeRoll > 0.75 ? 'large' : sizeRoll > 0.4 ? 'medium' : 'small');

  return {
    ...star,
    // Allow stars to extend slightly beyond the core frame so panning reveals more universe
    positionX: clamp(star.positionX ?? randomInRange(seed, 0, -0.1, 1.1), -0.1, 1.1),
    positionY: clamp(star.positionY ?? randomInRange(seed, 1, -0.1, 1.1), -0.1, 1.1),
    brightness: normalizedBrightness,
    size: normalizedSize,
    timestamp:
      star.timestamp instanceof Date
        ? star.timestamp
        : new Date((star.timestamp as unknown as string) ?? Date.now()),
  };
};

const createSyntheticStar = (index: number, total: number): Star => {
  const seed = index + total * 73;
  const baseSizeRoll = randomInRange(seed, 2, 0, 1);
  const size: Star['size'] = baseSizeRoll > 0.75 ? 'large' : baseSizeRoll > 0.4 ? 'medium' : 'small';

  return normalizeStar(
    {
      id: `synthetic-star-${index}`,
      userId: 'demo-user',
      constellationId: `demo-constellation-${(index % 3) + 1}`,
      positionX: randomInRange(seed, 0, 0.12, 0.88),
      positionY: randomInRange(seed, 1, 0.18, 0.82),
      size,
      type: 'focus_session',
      brightness: randomInRange(seed, 3, 0.7, 1),
      action: 'Preview star',
      timestamp: new Date(Date.now() - index * 60 * 60 * 1000),
    },
    seed
  );
};

interface ConstellationSkyProps {
  skyState: SkyState;
  compact?: boolean; // For home screen preview
  onStarPress?: (star: Star) => void;
  enableGestures?: boolean; // Enable pan and zoom
}

/**
 * Constellation Sky Component
 * Renders the beautiful night sky with user's earned stars
 */
export function ConstellationSky({ skyState, compact = false, onStarPress, enableGestures = false }: ConstellationSkyProps) {
  const stage = useMemo(() => getUniverseStage(skyState), [skyState]);
  const { theme } = stage;

  const backgroundStars = useMemo(
    () =>
      Array.from({ length: 50 }).map((_, index) => {
        const seed = hashString(`${theme.id}-base-star-${index}`);

        return {
          xRatio: randomInRange(seed, 0, 0, 1),
          yRatio: randomInRange(seed, 1, 0, 1),
          opacity: randomInRange(seed, 2, 0.35, 0.8),
          size: randomInRange(seed, 3, 1.4, 2.6),
        };
      }),
    [theme.id]
  );

  const stars = useMemo(() => {
    const baseStars = skyState.constellations.flatMap(constellation => constellation.stars ?? []);
    const normalized = baseStars.map((star, index) => normalizeStar(star, hashString(star.id) + index));

    const minimumCount = stage.level === 0 ? 45 : 60;
    const densityCap = clamp(
      Math.round(MAX_RENDERED_STARS * stage.starDensity),
      minimumCount,
      MAX_RENDERED_STARS
    );
    const desiredCount = Math.max(
      normalized.length,
      Math.round((skyState.totalStars ?? 0) * (0.55 + stage.starDensity / 1.4)),
      minimumCount
    );
    const targetCount = clamp(desiredCount, minimumCount, densityCap);

    if (normalized.length >= targetCount) {
      return normalized.slice(0, targetCount);
    }

    const extras = Array.from({ length: targetCount - normalized.length }, (_, extraIndex) =>
      createSyntheticStar(normalized.length + extraIndex, targetCount)
    );

    return [...normalized, ...extras];
  }, [skyState.constellations, skyState.totalStars, stage]);

  // Base viewport that matches the framed sky height on MySky
  const viewportHeight = compact ? 240 : SCREEN_HEIGHT * 0.45;
  const viewportWidth = SCREEN_WIDTH;
  const panPadding = enableGestures && !compact ? viewportWidth * 0.3 : 0;
  const containerHeight = viewportHeight + panPadding * 2;
  const containerWidth = viewportWidth + panPadding * 2;
  const universeScaleStyle = !compact ? { transform: [{ scale: stage.scale }] as const } : undefined;

  // Pan and zoom gesture values
  const initialTranslate = enableGestures && !compact ? -panPadding : 0;
  const translateX = useSharedValue(initialTranslate);
  const translateY = useSharedValue(initialTranslate);
  const scale = useSharedValue(1);
  const savedTranslateX = useSharedValue(initialTranslate);
  const savedTranslateY = useSharedValue(initialTranslate);
  const savedScale = useSharedValue(1);

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .enabled(enableGestures)
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      // Clamp scale between 0.5x and 3x
      scale.value = withSpring(Math.max(0.5, Math.min(3, scale.value)));
      savedScale.value = scale.value;
    });

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .enabled(enableGestures)
    .onUpdate((event) => {
      const nextX = savedTranslateX.value + event.translationX;
      const nextY = savedTranslateY.value + event.translationY;
      translateX.value = clamp(nextX, initialTranslate - panPadding, initialTranslate + panPadding);
      translateY.value = clamp(nextY, initialTranslate - panPadding, initialTranslate + panPadding);
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // Animated style for pan and zoom
  const panZoomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ] as const,
  }));

  const skyContent = (
    <View style={[styles.container, { height: containerHeight }]}> 
      <LinearGradient colors={theme.gradient} style={styles.skyBackground} />

      <Animated.View style={[styles.energyField, { opacity: 0.25 + stage.energy * 0.45 }]} />

      <View pointerEvents="none" style={styles.nebulaLayer}>
        {theme.nebulae.map((config, index) => (
          <NebulaLayer
            key={`${theme.id}-nebula-${index}`}
            config={config}
            stageEnergy={stage.energy}
            containerWidth={containerWidth}
            containerHeight={containerHeight}
          />
        ))}
      </View>

      {skyState.hasAurora && !compact ? (
        <AuroraEffect colors={theme.haloColors} energy={stage.energy} />
      ) : null}

      {skyState.cloudCover > 0 && (
        <View style={[styles.cloudCover, { opacity: skyState.cloudCover }]} />
      )}

      <LinearGradient
        colors={['#0a0118', '#0f102d', '#1f1a41'] as const}
        style={styles.baseBackground}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      <View pointerEvents="none" style={styles.baseStarfield}>
        {backgroundStars.map((star, index) => (
          <View
            key={`base-star-${index}`}
            style={[
              styles.baseStar,
              {
                left: star.xRatio * containerWidth,
                top: star.yRatio * containerHeight,
                opacity: star.opacity,
                width: star.size,
                height: star.size,
              },
            ]}
          />
        ))}
      </View>

      <View style={[styles.starsLayer, universeScaleStyle]}>
        {stars.map(star => (
          <StarView
            key={star.id}
            star={star}
            containerWidth={containerWidth}
            containerHeight={containerHeight}
            onPress={onStarPress}
            stage={stage}
            theme={theme}
          />
        ))}
      </View>

      {!compact && (skyState.hasShootingStars || stage.level >= 2) ? (
        <>
          <ShootingStar
            delay={0}
            color={theme.shootingStarColor}
            trailColor={theme.trailColor}
            stageEnergy={stage.energy}
          />
          <ShootingStar
            delay={6000}
            color={theme.shootingStarColor}
            trailColor={theme.trailColor}
            stageEnergy={stage.energy}
          />
          <ShootingStar
            delay={12000}
            color={theme.shootingStarColor}
            trailColor={theme.trailColor}
            stageEnergy={stage.energy}
          />
        </>
      ) : null}

      {!compact && skyState.constellations.map(constellation => (
        <ConstellationLines 
          key={constellation.type} 
          constellation={constellation}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      ))}
    </View>
  );

  if (enableGestures && !compact) {
    return (
      <GestureDetector gesture={composedGesture}>
        <View style={[styles.viewport, { height: viewportHeight, width: viewportWidth }]}>
          <Animated.View style={[{ width: containerWidth, height: containerHeight }, panZoomStyle]}>
            {skyContent}
          </Animated.View>
        </View>
      </GestureDetector>
    );
  }

  return (
    <View style={[styles.viewport, { height: viewportHeight, width: viewportWidth }]}>
      {skyContent}
    </View>
  );
}

/**
 * Individual Star Component
 */
function StarView({
  star,
  containerWidth,
  containerHeight,
  onPress,
  stage,
  theme,
}: {
  star: Star;
  containerWidth: number;
  containerHeight: number;
  onPress?: (star: Star) => void;
  stage: UniverseStage;
  theme: UniverseTheme;
}) {
  const seed = hashString(star.id);
  const color = getStarColor(theme.starPalette, seed);
  const haloColor = theme.haloColors?.[0] ?? 'rgba(255,255,255,0.2)';
  const haloOuter = theme.haloColors?.[1] ?? 'rgba(255,255,255,0)';

  const baseBrightness = clamp(star.brightness ?? 0.8, stage.twinkleRange[0], stage.twinkleRange[1]);
  const twinkle = useSharedValue(baseBrightness);
  const scale = useSharedValue(0);
  const orbit = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    scale.value = withDelay(
      Math.random() * 220,
      withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) })
    );

    // Twinkling animation
    twinkle.value = withRepeat(
      withTiming(baseBrightness * 0.55, {
        duration: 1400 + Math.random() * 1400,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    // Subtle drift to keep universe feeling alive
    orbit.value = withRepeat(
      withTiming(1, {
        duration: 12000 + Math.random() * 4000,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: twinkle.value,
    transform: [
      { scale: scale.value * (1 + stage.energy * 0.18) },
      {
        translateX: orbit.value
          ? Math.sin(orbit.value * Math.PI * 2 + seed) * (1.5 + stage.energy * 3)
          : 0,
      },
      {
        translateY: orbit.value
          ? Math.cos(orbit.value * Math.PI * 2 + seed) * (1 + stage.energy * 2)
          : 0,
      },
    ] as const,
  }));

  const sizeMap = {
    small: 3,
    medium: 5,
    large: 8,
  };

  const size = sizeMap[star.size] + stage.level;
  const hasHalo = star.type === 'milestone' || stage.level >= 2;

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: star.positionX * containerWidth - size / 2,
          top: star.positionY * containerHeight - size / 2,
        },
        animatedStyle,
      ]}
      onTouchEnd={() => onPress?.(star)}
    >
      {/* Halo for milestone stars */}
      {hasHalo && (
        <View
          style={[
            styles.halo,
            {
              width: size * 4.6,
              height: size * 4.6,
              backgroundColor: haloOuter,
              borderColor: haloColor,
            },
          ]}
        />
      )}
      
      {/* Star */}
      <View
        style={[
          styles.starCore,
          {
            width: size,
            height: size,
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      />
    </Animated.View>
  );
}

/**
 * Aurora Effect (unlocked at 30-day streak)
 */
function AuroraEffect({ colors, energy }: { colors: readonly [string, string]; energy: number }) {
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);

  useEffect(() => {
    wave1.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    wave2.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const baseColor1 = colors[0] ?? 'rgba(138, 43, 226, 0.2)';
  const baseColor2 = colors[1] ?? 'rgba(59, 125, 255, 0.15)';

  const wave1Style = useAnimatedStyle(() => ({
    opacity: 0.18 + wave1.value * (0.12 + energy * 0.08),
    transform: [{ translateY: wave1.value * 18 - 9 }] as const,
  }));

  const wave2Style = useAnimatedStyle(() => ({
    opacity: 0.12 + wave2.value * (0.1 + energy * 0.05),
    transform: [{ translateY: wave2.value * -14 + 6 }] as const,
  }));

  return (
    <>
      <Animated.View
        style={[
          styles.auroraWave,
          styles.auroraWave1,
          { backgroundColor: baseColor1 },
          wave1Style,
        ]}
      />
      <Animated.View
        style={[
          styles.auroraWave,
          styles.auroraWave2,
          { backgroundColor: baseColor2 },
          wave2Style,
        ]}
      />
    </>
  );
}

function NebulaLayer({
  config,
  stageEnergy,
  containerWidth,
  containerHeight,
}: {
  config: NebulaConfig;
  stageEnergy: number;
  containerWidth: number;
  containerHeight: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay ?? Math.random() * 4000,
      withRepeat(
        withTiming(1, {
          duration: config.duration ?? 42000,
          easing: Easing.inOut(Easing.cubic),
        }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: config.opacity * (0.75 + stageEnergy * 0.5),
    transform: [
      {
        translateX: Math.sin(progress.value * Math.PI * 2) * 22,
      },
      {
        translateY: Math.cos(progress.value * Math.PI * 2) * 18,
      },
      {
        rotate: `${config.rotation + progress.value * 6}deg`,
      },
    ] as const,
  }));

  const size = Math.min(containerWidth, containerHeight) * (config.size / 400);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.nebula,
        {
          width: size,
          height: size,
          top: config.topRatio * containerHeight,
          left: config.leftRatio * containerWidth,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={config.colors}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={styles.nebulaGradient}
      />
    </Animated.View>
  );
}

/**
 * Shooting Star (unlocked at 100 stars)
 */
function ShootingStar({
  delay,
  color,
  trailColor,
  stageEnergy,
}: {
  delay: number;
  color: string;
  trailColor: string;
  stageEnergy: number;
}) {
  const translateX = useSharedValue(-100);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      translateX.value = -100;
      translateY.value = Math.random() * 200;
      opacity.value = 0;

      translateX.value = withDelay(
        delay,
        withTiming(SCREEN_WIDTH + 100, { duration: 2000, easing: Easing.linear })
      );
      translateY.value = withDelay(
        delay,
        withTiming((Math.random() * 200) + 100, { duration: 2000, easing: Easing.linear })
      );
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 100 }, () => {
          opacity.value = withDelay(1500, withTiming(0, { duration: 400 }));
        })
      );

      setTimeout(animate, 15000 + Math.random() * 10000);
    };

    animate();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: '45deg' },
    ] as const,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.shootingStar, { shadowOpacity: 0.9 + stageEnergy * 0.3 }, animatedStyle]}>
      <LinearGradient
        colors={[color, trailColor] as const}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
    </Animated.View>
  );
}

/**
 * Constellation Lines (connect stars in a constellation)
 */
function ConstellationLines({ 
  constellation,
  containerWidth,
  containerHeight,
}: { 
  constellation: { stars?: Star[] };
  containerWidth: number;
  containerHeight: number;
}) {
  if (!constellation.stars || constellation.stars.length < 2) {
    return null;
  }

  // Connect adjacent stars in the constellation
  // Stars may have position or default to 0.5 if not set
  const getCoord = (star: Star, axis: 'x' | 'y') => {
    const legacyKey = axis === 'x' ? (star as unknown as { x?: number }).x : (star as unknown as { y?: number }).y;
    const normalizedKey = axis === 'x' ? star.positionX : star.positionY;
    return typeof legacyKey === 'number'
      ? legacyKey
      : typeof normalizedKey === 'number'
        ? normalizedKey
        : 0.5;
  };

  const lines = constellation.stars.slice(0, -1).map((star, index) => {
    const nextStar = constellation.stars![index + 1];
    const starX = getCoord(star, 'x');
    const starY = getCoord(star, 'y');
    const nextX = getCoord(nextStar, 'x');
    const nextY = getCoord(nextStar, 'y');
    
    return {
      x1: starX * containerWidth,
      y1: starY * containerHeight,
      x2: nextX * containerWidth,
      y2: nextY * containerHeight,
      key: `${star.id}-${nextStar.id}`,
    };
  });

  return (
    <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {lines.map(line => (
        <Line
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="rgba(138, 191, 255, 0.3)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
    borderRadius: 28,
    alignSelf: 'center',
  },
  container: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  skyBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#060015',
  },
  baseBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  baseStarfield: {
    ...StyleSheet.absoluteFillObject,
  },
  baseStar: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  energyField: {
    position: 'absolute',
    top: -SCREEN_HEIGHT * 0.22,
    left: -SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 1.4,
    height: SCREEN_WIDTH * 1.4,
    borderRadius: (SCREEN_WIDTH * 1.4) / 2,
    backgroundColor: 'rgba(130, 80, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(210, 190, 255, 0.18)',
    shadowColor: '#8a5bff',
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 40,
  },
  nebulaLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  starsLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  cloudCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1428',
  },
  star: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starCore: {
    backgroundColor: '#ffffff',
    borderRadius: 100,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 6,
  },
  halo: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  auroraWave: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 200,
  },
  auroraWave1: {
    top: '20%',
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    borderRadius: 100,
  },
  auroraWave2: {
    top: '30%',
    backgroundColor: 'rgba(59, 125, 255, 0.1)',
    borderRadius: 100,
  },
  nebula: {
    position: 'absolute',
    borderRadius: 320,
    overflow: 'hidden',
  },
  nebulaGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 320,
  },
  shootingStar: {
    position: 'absolute',
    width: 60,
    height: 2,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
  },
});
