import { useContext } from 'react';
import { ThemeContext } from '@/context/theme-context';

export { ThemeProvider } from '@/context/theme-context';

export function useColorScheme() {
  const { colorScheme } = useContext(ThemeContext);
  return colorScheme;
}
