import Constants from 'expo-constants';

// Expo Go cannot change native status bar appearance; detect to no-op those calls.
export const isExpoGo = Constants?.appOwnership === 'expo';
