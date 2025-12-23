import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface WatercolorCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  borderColor?: string;
  borderRadius?: number;
  backgroundColor?: string;
}

const WatercolorCard: React.FC<WatercolorCardProps> = ({
  children,
  style,
  padding = 16,
  borderColor = '#1f2937',
  borderRadius = 26,
  backgroundColor = '#fff',
}) => {
  return (
    <View
      style={[
        styles.card,
        {
          padding,
          borderColor,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
});

export default WatercolorCard;
