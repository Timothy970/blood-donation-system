import { DarkTheme, DefaultTheme, ThemeProvider as ExpoThemeProvider } from 'expo-router';
import { ThemeProvider, useColorScheme } from '@/hooks/use-color-scheme';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

function TabLayoutContent() {
  const colorScheme = useColorScheme();
  return (
    <ExpoThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ExpoThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <ThemeProvider>
      <TabLayoutContent />
    </ThemeProvider>
  );
}
