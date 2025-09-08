import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { DataProvider } from './src/contexts/DataContext';
import { theme } from './src/utils/theme';
import { initializeDatabase } from './src/services/database';
import { initializeSupabase } from './src/services/supabase';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need here
        await Font.loadAsync({
          'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
          'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
        });

        // Initialize local database
        await initializeDatabase();
        
        // Initialize Supabase
        await initializeSupabase();
        
        // Artificially delay for demo purposes
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <DataProvider>
            <NavigationContainer>
              <StatusBar 
                barStyle="dark-content" 
                backgroundColor="#ffffff" 
                translucent={Platform.OS === 'android'} 
              />
              <AppNavigator />
            </NavigationContainer>
          </DataProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});