import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import axios from 'axios';
import { AUTH_ERROR_EVENT } from '../services/api';

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
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      if (token) {
        try {
          // バックエンドでトークンの検証を行う
          try {
            const response = await authAPI.me();
            if (response && response.data && response.data.success) {
              setIsAuthenticated(true);
              setUser(response.data.data || (userData ? JSON.parse(userData) : null));
            } else {
              clearAuthData();
            }
          } catch (error) {
            clearAuthData();
          }
        } catch (error) {
          clearAuthData();
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  // 認証エラーイベントのリスナーを設定
  useEffect(() => {
    const handleAuthError = () => {
      clearAuthData();
    };

    // イベントリスナーを追加
    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError as EventListener);

    // クリーンアップ関数
    return () => {
      window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError as EventListener);
    };
  }, []);

  // 認証データをクリアしてログアウト状態にする関数
  const clearAuthData = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setUser(null);
    // APIクライアントの認証ヘッダーもクリア
    delete axios.defaults.headers.common['Authorization'];
  };

  // ログイン関数
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // APIクライアントを使用
      const response = await authAPI.login(email, password);
      
      if (response && response.data && response.data.success) {
        // 成功時の処理
        const token = response.data.data?.token || '';
        const userData = response.data.data?.user || null;
        
        // トークンとユーザーデータをストレージに保存
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // 認証状態を更新
        setIsAuthenticated(true);
        setUser(userData);
        
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };

  // サインアップ関数
  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      // APIクライアントを使用
      const response = await authAPI.signup(name, email, password);
      
      if (response && response.data && response.data.success) {
        // 成功時の処理
        const token = response.data.data?.token || '';
        const userData = response.data.data?.user || null;
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // 認証状態を更新
        setIsAuthenticated(true);
        setUser(userData);
        
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };

  // ログアウト関数
  const logout = () => {
    clearAuthData();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 
