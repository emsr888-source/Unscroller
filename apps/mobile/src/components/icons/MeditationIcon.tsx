import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function MeditationIcon({ 
  size = 24, 
  color = 'currentColor', 
  strokeWidth = 2,
  ...props 
}: SvgProps & { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Head */}
      <Circle cx="12" cy="6" r="2.5" />
      
      {/* Body */}
      <Path d="M12 8.5 L12 14" />
      
      {/* Arms in meditation pose */}
      <Path d="M12 10 L8 12 L6 10.5" />
      <Path d="M12 10 L16 12 L18 10.5" />
      
      {/* Legs in lotus position */}
      <Path d="M12 14 L9 16 L7 15" />
      <Path d="M12 14 L15 16 L17 15" />
      
      {/* Meditation energy/aura dots */}
      <Circle cx="9" cy="5" r="0.5" fill={color} />
      <Circle cx="15" cy="5" r="0.5" fill={color} />
      <Circle cx="7" cy="8" r="0.5" fill={color} />
      <Circle cx="17" cy="8" r="0.5" fill={color} />
    </Svg>
  );
}
