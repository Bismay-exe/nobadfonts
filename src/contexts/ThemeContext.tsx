import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'sepia' | 'vibrant' | 'candy' | 'soft-blue' | 'luxury' | 'terminal' | 'nature' | 'neo-red' | 'neo-blue' | 'neo-yellow' | 'uv' | 'rust' | 'concrete' | 'rgb-clash' | 'ikea-chaos';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme;
    return (stored && ['light', 'dark', 'sepia', 'vibrant', 'candy', 'soft-blue', 'luxury', 'terminal', 'nature', 'neo-red', 'neo-blue', 'neo-yellow', 'uv', 'rust', 'concrete', 'rgb-clash', 'ikea-chaos'].includes(stored)) ? stored : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme', theme);

    window.dispatchEvent(new Event("theme-change"));

  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const themes: Theme[] = ['light', 'dark', 'sepia', 'vibrant', 'candy', 'soft-blue', 'luxury', 'terminal', 'nature', 'neo-red', 'neo-blue', 'neo-yellow', 'uv', 'rust', 'concrete', 'rgb-clash', 'ikea-chaos'];
      const currentIndex = themes.indexOf(prev);
      const nextIndex = (currentIndex + 1) % themes.length;
      return themes[nextIndex];
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
