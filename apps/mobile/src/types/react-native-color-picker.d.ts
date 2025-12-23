declare module 'react-native-color-picker' {
  import * as React from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  export type HSV = {
    h: number;
    s: number;
    v: number;
  };

  export type ColorPickerProps = {
    color?: string;
    defaultColor?: string;
    oldColor?: string;
    onColorChange?: (color: HSV) => void;
    onColorSelected?: (color: string) => void;
    onColorChangeComplete?: (color: string) => void;
    style?: StyleProp<ViewStyle>;
    hideSliders?: boolean;
    thumbSize?: number;
    sliderComponent?: React.ReactNode;
  };

  export class ColorPicker extends React.Component<ColorPickerProps> {}

  export const fromHsv: (color: HSV) => string;
  export const toHsv: (color: string | HSV) => HSV;
}
