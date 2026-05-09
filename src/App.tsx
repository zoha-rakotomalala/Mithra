import 'react-native-gesture-handler';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import ApplicationNavigator from '@/navigation/Application';
import { ThemeProvider } from '@/theme';
import '@/translations';

import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/organisms/ErrorBoundary/ErrorBoundary';
import { useAppStore } from '@/store';
import { storage } from '@/store/storage';

export { storage } from '@/store/storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: false,
    },
    queries: {
      retry: false,
    },
  },
});

function StoreInitializer({ children }: { children: React.ReactNode }) {
  const loadFromStorage = useAppStore((s) => s.loadFromStorage);
  const loadPaletteFromStorage = useAppStore((s) => s.loadPaletteFromStorage);

  useEffect(() => {
    loadFromStorage();
    loadPaletteFromStorage();
  }, [loadFromStorage, loadPaletteFromStorage]);

  return <>{children}</>;
}

function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider storage={storage}>
            <AuthProvider>
              <StoreInitializer>
                <ApplicationNavigator />
              </StoreInitializer>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default App;
