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
    console.log('Login request:', credentials);
    try {
      const response = await api.post<AuthResponse>('/api/login', credentials);
      console.log('Login response:', response);
      return response;
    } catch (error) {
      console.error('Login error details:', error);
      throw error;
    }
  },

  /**
   * サインアップ（ユーザー登録）
   * @param userData ユーザー登録情報
   */
  async signup(userData: SignupData): Promise<ApiResponse<AuthResponse>> {
    console.log('Signup request details:', {
      url: '/api/signup',
      data: {
        ...userData,
        password: '********', // セキュリティのためパスワードを非表示
        password_confirmation: '********'
      }
    });

    try {
      // APIコール直前のログ
      console.log('[USER-SERVICE] Sending signup request to backend API');
      
      // リクエスト送信
      const response = await api.post<AuthResponse>('/api/signup', userData);
      
      // レスポンス受信のログ
      console.log('[USER-SERVICE] Signup response received:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
        data: response.data ? {
          user: {
            id: response.data.user.id,
            name: response.data.user.name,
            email: response.data.user.email
          },
          tokenExists: !!response.data.token
        } : null
      });
      
      return response;
    } catch (error: any) {
      // 詳細なエラー情報をログに出力
      console.error('[USER-SERVICE] Signup error:', error);
      console.error('[USER-SERVICE] Error type:', typeof error);
      
      if (error.response) {
        console.error('[USER-SERVICE] Error response status:', error.response.status);
        console.error('[USER-SERVICE] Error response data:', JSON.stringify(error.response.data, null, 2));
      }
      
      if (error.request) {
        console.error('[USER-SERVICE] Error request sent but no response received');
      }
      
      if (error.message) {
        console.error('[USER-SERVICE] Error message:', error.message);
      }
      
      // エラー情報をrethrow
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
      console.error('Logout error details:', error);
      throw error;
    }
  },

  /**
   * 現在のユーザー情報を取得
   */
  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      console.log('Fetching current user info...');
      const token = localStorage.getItem('auth_token');
      
      // トークンが存在しない場合
      if (!token) {
        console.error('No auth token found in localStorage');
        return {
          success: false,
          message: '認証トークンが見つかりません',
          data: null
        };
      }
      
      // トークンの有効性をチェック（空文字列やnullでないか）
      if (token.trim() === '') {
        console.error('Empty auth token found');
        localStorage.removeItem('auth_token'); // 空のトークンは削除
        return {
          success: false,
          message: '無効な認証トークンです',
          data: null
        };
      }

      // JWTトークンの基本的な形式チェック（デバッグ用）
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT token format (should have 3 parts)');
        localStorage.removeItem('auth_token');
        return {
          success: false, 
          message: 'トークンの形式が無効です',
          data: null
        };
      }

      console.log(`Sending authenticated request with token: ${token.substring(0, 15)}...`);
      
      const apiResponse = await api.get<User>('/api/auth/me');
      
      if (apiResponse && apiResponse.success && apiResponse.data) {
        console.log(`Valid user data received for: ${apiResponse.data.email}`);
        return apiResponse;
      } else {
        console.error('Invalid response data - missing success or data');
        localStorage.removeItem('auth_token');
        return {
          success: false,
          message: '認証に失敗しました',
          data: null
        };
      }
    } catch (error: any) {
      console.error('Get current user error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // 401エラーの場合はトークンをクリア
      if (error.response?.status === 401) {
        console.warn('Clearing token due to 401 Unauthorized response');
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
      console.error('Update profile error details:', error);
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
      console.error('Forgot password error details:', error);
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
      console.error('Reset password error details:', error);
      throw error;
    }
  }
};

export default userService; 
