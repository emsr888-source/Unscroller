import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Line } from 'react-native-svg';
import { PAPER_TEXTURE_SOURCE, STITCH_PAPER_URI } from './watercolorTheme';

interface WatercolorBackdropProps {
  tintColor?: string;
}

const WatercolorBackdrop: React.FC<WatercolorBackdropProps> = ({ tintColor = 'rgba(253, 251, 247, 0.85)' }) => {
  return (
    <View pointerEvents="none" style={styles.container}>
      <Image
        source={{ uri: STITCH_PAPER_URI }}
        style={styles.fill}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <Image
        source={PAPER_TEXTURE_SOURCE}
        style={styles.texture}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={['rgba(254, 243, 199, 0.55)', 'rgba(199, 210, 254, 0.35)', 'rgba(248, 250, 252, 0.6)']}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      />
      <GridOverlay />
      <View style={[styles.tint, { backgroundColor: tintColor }]} />
    </View>
  );
};

const GridOverlay = () => (
  <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Defs>
      <Pattern id="gridPattern" width="24" height="24" patternUnits="userSpaceOnUse">
        <Rect x="0" y="0" width="24" height="24" fill="transparent" />
        <Line x1="0" y1="0" x2="24" y2="0" stroke="#9ca3af" strokeWidth={0.4} />
        <Line x1="0" y1="0" x2="0" y2="24" stroke="#9ca3af" strokeWidth={0.4} />
      </Pattern>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#gridPattern)" opacity={0.12} />
  </Svg>
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default WatercolorBackdrop;
