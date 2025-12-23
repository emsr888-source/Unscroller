import React, { useCallback, useRef, useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import SignatureCanvas, { SignatureCanvasHandle } from '@/components/SignatureCanvas';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Commitment'>;

export default function CommitmentScreen({ navigation }: Props) {
  const signatureRef = useRef<SignatureCanvasHandle | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signaturePath, setSignaturePath] = useState('');
  const insets = useSafeAreaInsets();

  const handleDrawingChange = useCallback((value: boolean) => {
    setHasDrawn(value);
  }, []);

  const handlePathEnd = useCallback((path: string) => {
    setSignaturePath(path);
  }, []);

  const handleClear = () => {
    signatureRef.current?.clear();
    setHasDrawn(false);
    setSignaturePath('');
  };

  const handleFinish = () => {
    if (!hasDrawn || !signaturePath) {
      Alert.alert(
        'Draw your commitment',
        'Please draw your signature or message in the canvas above to commit to your journey.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // In a follow-up integration we could persist `signaturePath`
    // or upload it. For now we simply proceed to the next step.
    navigation.navigate('PlanPreview');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Sign your commitment</Text>
        <Text style={styles.subtitle}>
          Anchor the promise to your future self. This signature unlocks the next stage of your journey.
        </Text>
      </View>

      <View style={styles.canvasContainer}>
        <View style={styles.canvasFrame}>
          <SignatureCanvas
            ref={signatureRef}
            backgroundColor="#FFFFFF"
            strokeColor="#111827"
            strokeWidth={3}
            onDrawingChange={handleDrawingChange}
            onPathEnd={handlePathEnd}
            height="100%"
            width="100%"
          />
        </View>
        <Pressable onPress={handleClear} accessibilityRole="button" accessibilityLabel="Clear signature area">
          <Text style={styles.clearText}>Start over</Text>
        </Pressable>
        <Text style={styles.hint}>Use your finger to sign anywhere in the box.</Text>
      </View>

      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, SPACING.space_2) }]}> 
        <WatercolorButton color="yellow" onPress={hasDrawn ? handleFinish : undefined}>
          <Text style={[styles.buttonText, !hasDrawn && styles.buttonTextDisabled]}>Finish</Text>
        </WatercolorButton>
        <Text style={styles.bottomNote}>Your signature stays on-device and simply confirms your commitment.</Text>
      </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: SPACING.space_6,
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_3,
  },
  title: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    color: '#1f2937',
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    fontSize: 16,
    color: '#475569',
  },
  canvasContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.space_2,
    paddingHorizontal: SPACING.space_5,
  },
  canvasFrame: {
    width: '100%',
    maxWidth: 600,
    aspectRatio: 1.4,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  clearText: {
    ...TYPOGRAPHY.Body,
    color: '#475569',
  },
  hint: {
    ...TYPOGRAPHY.Subtext,
    color: '#475569',
    textAlign: 'center',
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_3,
    gap: SPACING.space_2,
  },
  bottomNote: {
    ...TYPOGRAPHY.Subtext,
    color: '#475569',
    textAlign: 'center',
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  buttonTextDisabled: {
    opacity: 0.5,
  },
});
