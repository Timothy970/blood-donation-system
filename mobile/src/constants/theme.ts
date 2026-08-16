/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  dark: {
    background: '#131314',
    backgroundDim: '#0E0E0F',
    surfaceContainer: '#1C1B1C',
    surfaceHigh: '#2A2A2B',
    surfaceHighest: '#353436',
    
    backgroundElement: '#1C1B1C',
    backgroundSelected: '#2A2A2B',
    
    primary: '#FF5357',
    primaryNeon: '#FF0033',
    secondary: '#00F1FE',
    secondaryBright: '#74F5FF',
    
    text: '#E5E2E3',
    textSecondary: '#919095',
    textMuted: '#919095',
    textDim: '#5F3E3D',
    
    bioGreen: '#00FF94',
    warningGold: '#FFAB00',
    
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    cyanGlow: 'rgba(0, 241, 254, 0.2)',
    crimsonGlow: 'rgba(255, 0, 51, 0.25)',
  },
  light: {
    background: '#F8F9FA',
    backgroundDim: '#F1F3F5',
    surfaceContainer: '#FFFFFF',
    surfaceHigh: '#E9ECEF',
    surfaceHighest: '#DEE2E6',
    
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E9ECEF',
    
    primary: '#FF5357',
    primaryNeon: '#FF0033',
    secondary: '#0096C7',
    secondaryBright: '#00F1FE',
    
    text: '#1A1A1A',
    textSecondary: '#6C757D',
    textMuted: '#6C757D',
    textDim: '#ADB5BD',
    
    bioGreen: '#00A86B',
    warningGold: '#D97706',
    
    glassBorder: 'rgba(0, 0, 0, 0.1)',
    cyanGlow: 'rgba(0, 150, 199, 0.2)',
    crimsonGlow: 'rgba(255, 0, 51, 0.25)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
