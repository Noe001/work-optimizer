import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// 認証コンテキストの型定義
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  user: any;
}

// デフォルト値を設定
const defaultAuthContext: AuthContextType = {
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  user: null
};

// コンテキストの作成
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// コンテキストを使用するためのカスタムフック
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// 認証プロバイダーコンポーネント
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);

  // 初期化時に保存されている認証情報を確認
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      if (token) {
        setIsAuthenticated(true);
        setUser(userData ? JSON.parse(userData) : null);
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  // ログイン関数
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // シンプル化のため、実際のAPI呼び出しはコメントアウト
      // const response = await fetch('/api/sessions', {...});
      
      // 簡易的な認証（実際の実装では必ずバックエンドでの検証が必要）
      // ここでは単純に、emailとpasswordが空でなければログイン成功としています
      if (email && password) {
        // 成功時の処理
        const mockUser = { id: 1, email, name: email.split('@')[0] };
        const mockToken = "mock_token_" + Date.now();
        
        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('user_data', JSON.stringify(mockUser));
        
        setIsAuthenticated(true);
        setUser(mockUser);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // サインアップ関数
  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      // シンプル化のため、実際のAPI呼び出しはコメントアウト
      // const response = await fetch('/api/users', {...});
      
      // 簡易的なサインアップ（実際の実装では必ずバックエンドでの検証が必要）
      if (email && password && name) {
        // 成功時の処理
        const mockUser = { id: 1, email, name };
        const mockToken = "mock_token_" + Date.now();
        
        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('user_data', JSON.stringify(mockUser));
        
        setIsAuthenticated(true);
        setUser(mockUser);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  // ログアウト関数
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, signup, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}; 
