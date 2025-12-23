import React from 'react';
import { Image, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'RecoveryGraph'>;

const GRAPH_IMAGE = require('../../../../recovery_graph.png');
const IMAGE_ASPECT_RATIO = 768 / 1376; // width / height from asset metadata

export default function RecoveryGraphScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const contentMaxWidth = Math.min(windowWidth - SPACING.space_4 * 2, 520);

  const handleContinue = () => {
    navigation.navigate('GoalSelection');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View
        style={[
          styles.content,
          { paddingTop: Math.max(insets.top + SPACING.space_2, SPACING.space_5) },
        ]}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Recovery Progress</Text>
          <Text style={styles.heroSubtitle}>Visualize your journey to digital wellness.</Text>
        </View>
        <View style={[styles.graphContainer, { maxWidth: contentMaxWidth }]}>
          <Image
            source={GRAPH_IMAGE}
            style={[styles.graphImage, { maxWidth: contentMaxWidth }]}
            resizeMode="contain"
          />
        </View>
      </View>
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, SPACING.space_2) }]}>
        <WatercolorButton color="yellow" onPress={handleContinue}>
          <Text style={styles.buttonText}>Start My Journey</Text>
        </WatercolorButton>
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_4,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: SPACING.space_2,
    marginBottom: SPACING.space_2,
  },
  heroTitle: {
    fontFamily: 'PatrickHand-Regular',
    color: '#1f2937',
    textAlign: 'center',
    fontSize: 36,
    lineHeight: 44,
  },
  heroSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    lineHeight: 28,
    color: '#475569',
    textAlign: 'center',
  },
  graphContainer: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  graphImage: {
    width: '100%',
    maxWidth: 520,
    aspectRatio: IMAGE_ASPECT_RATIO,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_3,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
});
