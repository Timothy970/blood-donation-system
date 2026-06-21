import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export type ColorSchemeType = 'light' | 'dark';

interface ThemeContextProps {
  colorScheme: ColorSchemeType;
  setColorScheme: (scheme: ColorSchemeType) => void;
  toggleColorScheme: () => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  colorScheme: 'dark',
  setColorScheme: () => {},
  toggleColorScheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useRNColorScheme();
  const [colorScheme, setScheme] = useState<ColorSchemeType>(
    (systemScheme === 'unspecified' ? 'dark' : systemScheme) || 'dark'
  );

  // Sync with system theme changes initially if user has not manually toggled
  useEffect(() => {
    if (systemScheme && systemScheme !== 'unspecified') {
      setScheme(systemScheme);
    }
  }, [systemScheme]);

  const toggleColorScheme = () => {
    setScheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme: setScheme, toggleColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
