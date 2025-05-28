import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import axios from 'axios';
import { AUTH_ERROR_EVENT } from '../services/api';
import { User, SignupRequest, LoginRequest } from '../types/api';

// 認証コンテキストの型定義
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupRequest) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

// デフォルト値を設定
const defaultAuthContext: AuthContextType = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  updateUser: () => {},
  refreshUser: async () => {}
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
  const [user, setUser] = useState<User | null>(null);

  // 初期化時に保存されている認証情報を確認
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          // バックエンドでトークンの検証を行う
          const response = await authAPI.me();
          if (response.success && response.data) {
            setIsAuthenticated(true);
            setUser(response.data);
          } else {
            clearAuthData();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
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
      const loginData: LoginRequest = { email, password };
      const response = await authAPI.login(loginData);
      
      if (response.success && response.data) {
        // 成功時の処理
        const token = response.data.token;
        const userData = response.data.user;
        
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
      console.error('Login failed:', error);
      return false;
    }
  };

  // サインアップ関数
  const signup = async (data: SignupRequest): Promise<boolean> => {
    try {
      const response = await authAPI.signup(data);
      
      if (response.success && response.data) {
        // 成功時の処理
        const token = response.data.token;
        const userData = response.data.user;
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // 認証状態を更新
        setIsAuthenticated(true);
        setUser(userData);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Signup failed:', error);
      return false;
    }
  };

  // ログアウト関数
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearAuthData();
    }
  };

  // ユーザー情報の更新
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  // ユーザー情報の再取得
  const refreshUser = async () => {
    try {
      const response = await authAPI.me();
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('user_data', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        signup,
        logout,
        updateUser,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 
