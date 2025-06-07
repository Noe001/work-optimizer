import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError, ApiResponse, AuthResponse, LoginRequest, SignupRequest, ChangePasswordRequest } from '../types/api';

// カスタムイベントの定義（認証エラー通知用）
export const AUTH_ERROR_EVENT = 'auth:error';

// 認証エラー発生時のイベント発火関数
export const triggerAuthError = (details: any = {}) => {
  const event = new CustomEvent(AUTH_ERROR_EVENT, { 
    detail: { 
      timestamp: new Date(),
      ...details
    } 
  });
  window.dispatchEvent(event);
};

// 開発環境と本番環境でベースURLを切り替え
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Axiosインスタンスの作成
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10秒でタイムアウト
  withCredentials: true, // CORSリクエストでCookieを送信するために必要
});

// リクエストインターセプター
apiClient.interceptors.request.use(
  (config) => {
    // キャッシュ回避のためにタイムスタンプパラメータを追加（GETリクエスト時）
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _: new Date().getTime() // タイムスタンプを追加
      };
    }

    // ローカルストレージからトークンを取得
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // 認証エラー（401）の場合にカスタムイベントを発火
    if (error.response && error.response.status === 401) {
      // パスワード変更エンドポイントの場合は認証エラーイベントを発火しない
      const isPasswordChangeRequest = error.config?.url?.includes('/auth/change-password');
      
      if (!isPasswordChangeRequest) {
        triggerAuthError({
          message: error.message,
          status: error.response.status,
          statusText: error.response.statusText
        });
      }
    }
    return Promise.reject(error);
  }
);

// AxiosResponseをApiResponse形式に変換する関数
function axiosToApiResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
  // バックエンドから既にApiResponse形式で返されている場合はそのまま返す
  if (response.data && typeof response.data === 'object' && 'success' in response.data) {
    const data = response.data as any;
    return {
      success: data.success,
      message: data.message || 'Success',
      data: data.data,
      code: data.code,
      errors: data.errors
    };
  }
  
  // そうでない場合は従来通りラップする
  return {
    success: true,
    message: 'Success',
    data: response.data
  };
}

// 共通APIメソッド
export const api = {
  /**
   * GETリクエスト
   * @param url エンドポイントURL
   * @param params クエリパラメータ
   * @param config Axiosリクエスト設定
   */
  async get<T>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.get<T>(url, { 
        params, 
        ...config 
      });
      
      return axiosToApiResponse<T>(response);
    } catch (error: any) {

      ApiErrorHandler.handle(error, `GET ${url}`);
    }
  },

  /**
   * POSTリクエスト
   * @param url エンドポイントURL
   * @param data リクエストボディ
   * @param config Axiosリクエスト設定
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.post<T>(url, data, config);
      return axiosToApiResponse<T>(response);
    } catch (error: any) {
      ApiErrorHandler.handle(error, `POST ${url}`);
    }
  },

  /**
   * PUTリクエスト
   * @param url エンドポイントURL
   * @param data リクエストボディ
   * @param config Axiosリクエスト設定
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      // FormDataの場合は_methodパラメータを追加してPOSTメソッドで送信
      if (data instanceof FormData) {
        console.log('FormDataを検出したため、POSTリクエストとして送信します', { url });
        data.append('_method', 'PUT');
        try {
          const response = await apiClient.post<T>(url, data, {
            ...config
          });
          return axiosToApiResponse<T>(response);
        } catch (error: any) {
          console.error('FormData PUT request failed:', error.message, { url, status: error.response?.status, data: error.response?.data });
          throw error;
        }
      }
      
      // 通常のJSONデータはPUTで送信
      const response = await apiClient.put<T>(url, data, config);
      return axiosToApiResponse<T>(response);
    } catch (error: any) {
      ApiErrorHandler.handle(error, `PUT ${url}`);
    }
  },

  /**
   * DELETEリクエスト
   * @param url エンドポイントURL
   * @param config Axiosリクエスト設定
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.delete<T>(url, config);
      return axiosToApiResponse<T>(response);
    } catch (error: any) {
      ApiErrorHandler.handle(error, `DELETE ${url}`);
    }
  },

  /**
   * PATCHリクエスト
   * @param url エンドポイントURL
   * @param data リクエストボディ (FormData も可)
   * @param config Axiosリクエスト設定
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const headers = data instanceof FormData
        ? { ...config?.headers } // FormData の場合は Content-Type を axios に任せる
        : { 'Content-Type': 'application/json', ...config?.headers };

      const response = await apiClient.patch<T>(url, data, { ...config, headers });
      return axiosToApiResponse<T>(response);
    } catch (error: any) {
      ApiErrorHandler.handle(error, `PATCH ${url}`);
    }
  },
};

// エラーハンドリングクラス
class ApiErrorHandler {
  static handle(error: AxiosError, context: string): never {
    const errorMessage = this.extractErrorMessage(error);
    const errorCode = error.response?.status;
    
    // ログ出力
    if (import.meta.env.DEV) {
      console.error(`[${context}] API Error:`, {
        message: errorMessage,
        status: errorCode,
        url: error.config?.url,
        data: error.response?.data
      });
    }
    
    // ユーザーフレンドリーなエラーメッセージ
    const userMessage = this.getUserFriendlyMessage(errorCode, errorMessage);
    
    const apiError: ApiError = {
      message: userMessage,
      code: (error.response?.data as any)?.code,
      errors: (error.response?.data as any)?.errors || []
    };
    
    throw apiError;
  }
  
  private static extractErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as any;
      return data.message || data.error || error.message;
    }
    return error.message || 'Unknown error';
  }
  
  private static getUserFriendlyMessage(status?: number, message?: string): string {
    switch (status) {
      case 400: return 'リクエストの形式が正しくありません。';
      case 401: return '認証に失敗しました。再度ログインしてください。';
      case 403: return 'この操作を実行する権限がありません。';
      case 404: return 'リソースが見つかりません。';
      case 422: return 'データの形式が正しくありません。';
      case 429: return 'リクエストが多すぎます。しばらく待ってから再試行してください。';
      case 500: return 'サーバーエラーが発生しました。しばらく待ってから再試行してください。';
      case 503: return 'サービスが一時的に利用できません。';
      default: return message || '予期しないエラーが発生しました。';
    }
  }
}

// 認証関連API
export const authAPI = {
  // JWTベースの認証
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await api.post<AuthResponse>('/api/login', data);
      
      // ログイン成功時にトークンをヘッダーに設定
      if (response.success && response.data?.token) {
        const token = response.data.token;
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      return response;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  
  signup: async (data: SignupRequest): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await api.post<AuthResponse>('/api/signup', data);
      
      // サインアップ成功時にトークンをヘッダーに設定
      if (response.success && response.data?.token) {
        const token = response.data.token;
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      return response;
    } catch (error) {
      console.error('Signup API error:', error);
      throw error;
    }
  },
  
  logout: async (): Promise<ApiResponse<void>> => {
    try {
      const response = await api.post<void>('/api/auth/logout');
      // ログアウト成功時にヘッダーからトークンを削除
      delete apiClient.defaults.headers.common['Authorization'];
      return response;
    } catch (error) {
      console.error('Logout API error:', error);
      // エラーが発生してもヘッダーからトークンを削除
      delete apiClient.defaults.headers.common['Authorization'];
      throw error;
    }
  },
  
  me: async (): Promise<ApiResponse<any>> => {
    return api.get('/api/auth/me');
  },

  changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse<void>> => {
    return api.post<void>('/api/auth/change-password', data);
  },

  // セッションベースの認証
  sessionLogin: async (data: LoginRequest): Promise<ApiResponse<any>> => {
    return api.post('/api/sessions', data);
  },
  
  sessionLogout: async (): Promise<ApiResponse<any>> => {
    return api.delete('/api/sessions');
  },
  
  checkSession: async (): Promise<ApiResponse<any>> => {
    return api.get('/api/sessions/new');
  }
};

export default apiClient; 
