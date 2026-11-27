import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppColors, MIN_INTERESTS } from '@/constants/topics';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ProgressProvider, useProgress } from '@/context/progress-context';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: AppColors.background, card: AppColors.background },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <AuthProvider>
        <ProgressProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </ProgressProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();
  const { profile, profileLoaded } = useProgress();

  // Keep the native splash up until we know where to send the user.
  if (loading || !profileLoaded) return null;

  const onboarded = !!session && (profile?.interests.length ?? 0) >= MIN_INTERESTS;

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: AppColors.background } }}>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="topics" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
      </Stack>
      <AnimatedSplashOverlay />
    </>
  );
}
