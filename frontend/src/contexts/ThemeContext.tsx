import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// システムのダークモード設定を検出
const getSystemTheme = (): Theme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// ローカルストレージからテーマを取得
const getStoredTheme = (): Theme | null => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('theme') as Theme;
      return stored && ['light', 'dark'].includes(stored) ? stored : null;
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
      return null;
    }
  }
  return null;
};

// ローカルストレージにテーマを保存
const storeTheme = (theme: Theme) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }
};

// HTMLのクラス名を更新
const updateDocumentClass = (theme: Theme) => {
  if (typeof window !== 'undefined') {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 初期テーマの決定（ローカルストレージ → システム設定 → ライトモード）
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme();
    return stored || getSystemTheme();
  });

  // テーマ変更処理
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    storeTheme(newTheme);
    updateDocumentClass(newTheme);
  };

  // テーマ切り替え処理
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // 初期テーマの適用
  useEffect(() => {
    updateDocumentClass(theme);
  }, []);

  // システムテーマ変更の監視（ユーザーがローカルストレージで設定していない場合のみ）
  useEffect(() => {
    const stored = getStoredTheme();
    if (!stored && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const systemTheme = e.matches ? 'dark' : 'light';
        setThemeState(systemTheme);
        updateDocumentClass(systemTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// テーマコンテキストを使用するためのカスタムフック
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext; 
