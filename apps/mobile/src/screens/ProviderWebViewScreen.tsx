import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import WebView from 'react-native-webview';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { PolicyService } from '@/services/policy';
import { PROVIDERS } from '@/constants/providers';

type Props = NativeStackScreenProps<RootStackParamList, 'ProviderWebView'>;

export default function ProviderWebViewScreen({ route, navigation }: Props) {
  const { providerId } = route.params;
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const provider = PROVIDERS.find(p => p.id === providerId);
  const rules = PolicyService.getProviderRules(
    providerId,
    Platform.OS === 'ios' ? 'ios' : 'android'
  );

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);

    // Check if navigation is allowed
    if (!PolicyService.isNavigationAllowed(providerId, navState.url, Platform.OS === 'ios' ? 'ios' : 'android')) {
      // Redirect to start URL
      webViewRef.current?.injectJavaScript(`
        window.location.href = '${rules.startURL}';
      `);
      
      // Show toast
      Alert.alert(
        'Blocked',
        'Creator Mode: This section is blocked',
        [{ text: 'OK' }]
      );
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    // URL-level blocking
    const isAllowed = PolicyService.isNavigationAllowed(
      providerId,
      request.url,
      Platform.OS === 'ios' ? 'ios' : 'android'
    );

    if (!isAllowed) {
      Alert.alert('Blocked', 'Creator Mode: This section is blocked');
    }

    return isAllowed;
  };

  const injectedJavaScript = Platform.OS === 'android' ? rules.domScript : rules.userScript;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{provider?.name}</Text>

        <TouchableOpacity
          onPress={() => webViewRef.current?.reload()}
          disabled={!canGoBack}
        >
          <Text style={styles.refreshButton}>↻</Text>
        </TouchableOpacity>
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: rules.startURL }}
        style={styles.webview}
        injectedJavaScript={injectedJavaScript}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        userAgent="CreatorMode/1.0 (Mobile)"
        allowsBackForwardNavigationGestures
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    fontSize: 16,
    color: '#fff',
    width: 60,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    fontSize: 24,
    color: '#fff',
    width: 60,
    textAlign: 'right',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
