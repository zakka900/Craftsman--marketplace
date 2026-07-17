import React from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import './src/i18n';
import RootNavigator from './src/navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } }
});

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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer theme={scheme === 'dark' ? navDark : navLight}>
          {/* "auto": icone status bar chiare/scure in base al tema di sistema */}
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
