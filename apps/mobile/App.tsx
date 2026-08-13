import React, { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import './src/i18n';
import RootNavigator from './src/navigation/RootNavigator';
import { restoreSession } from './src/services/api';
import { STRIPE_PUBLISHABLE_KEY } from './src/services/config';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } }
});

// @stripe/stripe-react-native è un SDK nativo puro (nessun supporto web reale):
// su web salta l'inizializzazione del bridge nativo, altrimenti l'app va in crash all'avvio.
// I pagamenti restano da testare su iOS/Android.
const StripeWrapper: React.ComponentType<{ publishableKey: string; children: React.ReactNode }> =
  Platform.OS === 'web' ? ({ children }) => <>{children}</> : StripeProvider;

// Temi di navigazione allineati ai token del design system:
// evita flash bianchi tra le schermate in Dark Mode.
const navLight = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: '#007AFF', background: '#F2F2F7', card: '#FFFFFF' }
};
const navDark = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: '#0A84FF', background: '#000000', card: '#1C1C1E' }
};

export default function App() {
  const scheme = useColorScheme();

  // Ripristina la sessione (token JWT su AsyncStorage) all'avvio
  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeWrapper publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer theme={scheme === 'dark' ? navDark : navLight}>
            {/* "auto": icone status bar chiare/scure in base al tema di sistema */}
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationContainer>
        </QueryClientProvider>
      </StripeWrapper>
    </GestureHandlerRootView>
  );
}
