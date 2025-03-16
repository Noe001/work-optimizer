import api from './api';
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
    return api.post<AuthResponse>('/auth/login', credentials);
  },

  /**
   * サインアップ（ユーザー登録）
   * @param userData ユーザー登録情報
   */
  async signup(userData: SignupData): Promise<ApiResponse<AuthResponse>> {
    return api.post<AuthResponse>('/auth/signup', userData);
  },

  /**
   * ログアウト
   */
  async logout(): Promise<ApiResponse<null>> {
    return api.post<null>('/auth/logout');
  },

  /**
   * 現在のユーザー情報を取得
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return api.get<User>('/auth/user');
  },

  /**
   * ユーザープロファイルを更新
   * @param userData 更新するユーザー情報
   */
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return api.put<User>('/users/profile', userData);
  },

  /**
   * パスワードリセットメールを送信
   * @param email メールアドレス
   */
  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    return api.post<null>('/auth/forgot-password', { email });
  },

  /**
   * パスワードをリセット
   * @param token リセットトークン
   * @param password 新しいパスワード
   * @param password_confirmation パスワード確認
   */
  async resetPassword(token: string, password: string, password_confirmation: string): Promise<ApiResponse<null>> {
    return api.post<null>('/auth/reset-password', {
      token,
      password,
      password_confirmation
    });
  }
};

export default userService; 
