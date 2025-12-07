import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    console.log('[Navigation] Auth state:', { isAuthenticated, inAuthGroup, segments });

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to sign in if not authenticated
      console.log('[Navigation] Redirecting to signin');
      router.replace('/signin');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to app if authenticated
      console.log('[Navigation] Redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <RootLayoutNav />
      </OrganizationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
