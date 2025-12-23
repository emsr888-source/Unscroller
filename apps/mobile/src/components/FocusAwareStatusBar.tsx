import React from 'react';
import { StatusBar, type StatusBarProps } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { isExpoGo } from '@/utils/isExpoGo';

/**
 * Only renders a StatusBar when the screen is focused so off-screen screens
 * can't override the current status bar style.
 */
export default function FocusAwareStatusBar(props: StatusBarProps) {
  const isFocused = useIsFocused();

  if (!isFocused || isExpoGo) {
    return null;
  }

  return <StatusBar {...props} />;
}
