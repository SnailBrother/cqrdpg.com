// ThemeContext.js
import React, { createContext, useState, useContext } from 'react';

const TravelThemeContext = createContext();

export const TravelThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // 默认是亮色主题

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <TravelThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </TravelThemeContext.Provider>
  );
};

export const useTheme = () => useContext(TravelThemeContext);