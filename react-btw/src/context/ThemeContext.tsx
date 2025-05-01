import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: false });

declare global {
  interface Window {
    initialTheme: boolean;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(window.initialTheme);

  useEffect(() => {
    // Apply initial theme
    document.documentElement.classList.toggle('dark', isDark);

    // Listen for theme changes from VSCode
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'themeChanged') {
        setIsDark(message.isDark);
        document.documentElement.classList.toggle('dark', message.isDark);
      }
    });
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 
