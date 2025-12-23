import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { useAppStore } from '@/store';

 type Props = NativeStackScreenProps<RootStackParamList, 'PolicyBypassWarning'>;
 
 export default function PolicyBypassWarningScreen({ navigation }: Props) {
   const setPolicyBypassEnabled = useAppStore(state => state.setPolicyBypassEnabled);
 
   const handleConfirmDisable = () => {
     setPolicyBypassEnabled(true);
     navigation.goBack();
   };
 
   const handleCancel = () => {
     navigation.goBack();
   };
 
   return (
     <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
       <View style={styles.container}>
         <View style={styles.badge}> 
           <Text style={styles.badgeText}>Security Notice</Text>
         </View>
         <Text style={styles.title}>Disable Content Guards?</Text>
         <Text style={styles.body}>
          Turning off content guards lifts feed hiding, autoplay muting, and URL blocking so you can complete stubborn login flows.
          Only do this briefly while signing in, then turn the guards back on to keep distractions filtered.
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Use this mode only to complete provider login flows.</Text>
          <Text style={styles.listItem}>• While disabled, feeds and distracting UI will be visible.</Text>
          <Text style={styles.listItem}>• Remember to re-enable guards as soon as you finish logging in.</Text>
        </View>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleConfirmDisable}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Temporarily Disable Guards</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCancel}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>Keep Guards On</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
 
 const styles = StyleSheet.create({
   safeArea: {
     flex: 1,
     backgroundColor: COLORS.BACKGROUND_MAIN,
     justifyContent: 'center',
   },
   container: {
     marginHorizontal: SPACING.space_5,
     padding: SPACING.space_5,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
   },
   badge: {
     alignSelf: 'flex-start',
     backgroundColor: 'rgba(255, 115, 0, 0.12)',
     paddingVertical: SPACING.space_1,
     paddingHorizontal: SPACING.space_2,
     borderRadius: 999,
     borderWidth: 1,
     borderColor: 'rgba(255, 149, 0, 0.4)',
     marginBottom: SPACING.space_3,
   },
   badgeText: {
     ...TYPOGRAPHY.Subtext,
     color: '#FF9500',
     fontWeight: '600',
     letterSpacing: 0.5,
   },
   title: {
     ...TYPOGRAPHY.H2,
     color: COLORS.TEXT_PRIMARY,
     marginBottom: SPACING.space_3,
   },
   body: {
     ...TYPOGRAPHY.Body,
     color: COLORS.TEXT_SECONDARY,
     lineHeight: 22,
     marginBottom: SPACING.space_3,
   },
   list: {
     marginBottom: SPACING.space_5,
     gap: SPACING.space_2,
   },
   listItem: {
     ...TYPOGRAPHY.Subtext,
     color: COLORS.TEXT_SECONDARY,
     lineHeight: 20,
   },
   buttonGroup: {
     gap: SPACING.space_3,
   },
   button: {
     backgroundColor: COLORS.ACCENT_GRADIENT_START,
     paddingVertical: SPACING.space_3,
     borderRadius: 16,
     alignItems: 'center',
     borderWidth: 1,
     borderColor: COLORS.GLASS_BORDER,
   },
   dangerButton: {
     backgroundColor: '#FF3B30',
     borderColor: 'rgba(255, 59, 48, 0.6)',
   },
   buttonText: {
     ...TYPOGRAPHY.Body,
     color: COLORS.TEXT_PRIMARY,
     fontWeight: '600',
   },
   secondaryButton: {
     backgroundColor: 'transparent',
     borderRadius: 16,
     alignItems: 'center',
     paddingVertical: SPACING.space_3,
   },
   secondaryButtonText: {
     ...TYPOGRAPHY.Body,
     color: COLORS.TEXT_PRIMARY,
     textDecorationLine: 'underline',
   },
 });
