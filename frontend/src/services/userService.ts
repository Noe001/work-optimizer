import { api } from './api';
import { ApiResponse, User } from '../types/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

/**
 * ユーザー認証と管理に関するサービス
 */
const userService = {
  /**
   * ログイン
   * @param credentials ログイン情報
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/api/login', credentials);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * サインアップ（ユーザー登録）
   * @param userData ユーザー登録情報
   */
  async signup(userData: SignupData): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/api/signup', userData);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * ログアウト
   */
  async logout(): Promise<ApiResponse<null>> {
    try {
      return await api.post<null>('/api/auth/logout');
    } catch (error) {
      throw error;
    }
  },

  /**
   * 現在のユーザー情報を取得
   */
  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      const token = localStorage.getItem('auth_token');
      
      // トークンが存在しない場合
      if (!token) {
        return {
          success: false,
          message: '認証トークンが見つかりません',
          data: null
        };
      }
      
      // トークンの有効性をチェック（空文字列やnullでないか）
      if (token.trim() === '') {
        localStorage.removeItem('auth_token'); // 空のトークンは削除
        return {
          success: false,
          message: '無効な認証トークンです',
          data: null
        };
      }

      // JWTトークンの基本的な形式チェック
      const parts = token.split('.');
      if (parts.length !== 3) {
        localStorage.removeItem('auth_token');
        return {
          success: false, 
          message: 'トークンの形式が無効です',
          data: null
        };
      }
      
      const apiResponse = await api.get<User>('/api/auth/me');
      
      if (apiResponse && apiResponse.success && apiResponse.data) {
        return apiResponse;
      } else {
        localStorage.removeItem('auth_token');
        return {
          success: false,
          message: '認証に失敗しました',
          data: null
        };
      }
    } catch (error: any) {
      // 401エラーの場合はトークンをクリア
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
      }
      
      // エラーレスポンスを返す（例外をスローしない）
      return {
        success: false,
        message: error.response?.data?.message || 'ユーザー情報の取得に失敗しました。',
        data: null
      };
    }
  },

  /**
   * ユーザープロファイルを更新
   * @param userData 更新するユーザー情報
   */
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      return await api.put<User>('/api/users/profile', userData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * パスワードリセットメールを送信
   * @param email メールアドレス
   */
  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    try {
      return await api.post<null>('/api/auth/forgot-password', { email });
    } catch (error) {
      throw error;
    }
  },

  /**
   * パスワードをリセット
   * @param token リセットトークン
   * @param password 新しいパスワード
   * @param password_confirmation パスワード確認
   */
  async resetPassword(token: string, password: string, password_confirmation: string): Promise<ApiResponse<null>> {
    try {
      return await api.post<null>('/api/auth/reset-password', {
        token,
        password,
        password_confirmation
      });
    } catch (error) {
      throw error;
    }
  }
};

export default userService; 
