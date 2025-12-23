import React, { useMemo } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';

type Props = {
  value: string;
  onChange: (next: string) => void;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_COLOR = '#ffffff';
export const COLOR_SWATCHES = ['#4DA1FF', '#7AE1C3', '#F5A524', '#F472B6', '#C084FC', '#A3E635', '#38BDF8', '#EF4444'];
export const IS_EXPO_GO = Constants.appOwnership === 'expo';

const ColorSpherePicker: React.FC<Props> = ({ value, onChange, style }) => {
  const normalizedColor = useMemo(() => {
    try {
      if (!value) {
        return DEFAULT_COLOR;
      }
      // Re-normalize through HSV to ensure valid format for the picker.
      const hsv = toHsv(value);
      return fromHsv(hsv);
    } catch {
      return DEFAULT_COLOR;
    }
  }, [value]);

  if (IS_EXPO_GO) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        {COLOR_SWATCHES.map(color => {
          const isSelected = normalizedColor.toLowerCase() === color.toLowerCase();
          return (
            <TouchableOpacity
              key={color}
              style={[styles.swatch, { backgroundColor: color }, isSelected && styles.swatchSelected]}
              onPress={() => onChange(color)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Select ${color}`}
            />
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ColorPicker
        color={normalizedColor}
        onColorChange={color => onChange(fromHsv(color))}
        hideSliders
        style={styles.picker}
        thumbSize={28}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  picker: {
    flex: 1,
  },
  fallbackContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  swatch: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(15, 23, 42, 0.12)',
  },
  swatchSelected: {
    borderColor: '#0f172a',
    borderWidth: 3,
  },
});

export default ColorSpherePicker;
