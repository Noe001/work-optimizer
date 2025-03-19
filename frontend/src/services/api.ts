import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError, ApiResponse } from '../types/api';

// 開発環境と本番環境でベースURLを切り替え
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

console.log('API Base URL:', BASE_URL); // デバッグ用のログ

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
    // リクエスト情報をログに出力（開発環境のみ）
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params);
    }

    // JWTトークンがあれば、それをヘッダーに追加
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // エラー情報をログに出力（開発環境のみ）
    if (import.meta.env.DEV) {
      console.error('API Response Error:', {
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      });
    }

    // 401エラー（認証エラー）時の処理
    if (error.response?.status === 401) {
      // 初期認証チェックかどうかを確認
      const isInitialAuthCheck = error.config?.url === '/api/auth/me' && 
                               error.config?.method?.toLowerCase() === 'get';
      
      // 現在のパスを取得
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath === '/login' || currentPath === '/signup';
      
      if (import.meta.env.DEV) {
        console.log('Auth error details:', {
          currentPath,
          isLoginPage,
          isInitialAuthCheck
        });
      }
      
      // 初期認証チェックまたはログインページでのエラーは無視
      if (!isInitialAuthCheck && !isLoginPage) {
        // カスタムイベントを発火して認証状態をリセット
        window.dispatchEvent(new CustomEvent('auth_token_invalid'));
      }

      // エラーメッセージを設定
      error.message = 'セッションが切れました。再度ログインしてください。';
    }
    
    return Promise.reject(error);
  }
);

// AxiosResponseをApiResponse形式に変換する関数
function axiosToApiResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
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
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: null as any
      };
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
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: null as any
      };
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
      const response = await apiClient.put<T>(url, data, config);
      return axiosToApiResponse<T>(response);
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: null as any
      };
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
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: null as any
      };
    }
  },
};

/**
 * APIエラーハンドリング
 */
const handleApiError = (error: AxiosError<ApiError>): never => {
  // エラーオブジェクトの構築
  const errorMessage = error.response?.data?.message || error.message || 'エラーが発生しました';
  const errorCode = error.response?.data?.code;
  const errorDetails = error.response?.data?.errors;
  
  // エラー詳細情報のログ出力（開発環境のみ）
  if (import.meta.env.DEV) {
    console.error('API Error Handle:', {
      message: errorMessage,
      code: errorCode,
      errors: errorDetails,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    // リクエスト情報
    if (error.config) {
      console.error('API Error Request:', {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL
      });
    }
  }
  
  // カスタムエラーオブジェクト
  const apiError: ApiError = {
    message: errorMessage,
    code: errorCode,
    errors: errorDetails,
  };
  
  // 401エラーの場合はトークン認証エラーを処理
  if (error.response?.status === 401) {
    console.log('Token authentication error', errorMessage);
  }
  
  // エラーをコンソールに出力（開発時のみ）
  if (import.meta.env.DEV) {
    console.error('API Error:', apiError);
  }
  
  throw apiError;
};

// 認証関連API
export const authAPI = {
  // JWTベースの認証
  login: async (email: string, password: string) => {
    return apiClient.post('/api/login', { email, password });
  },
  signup: async (name: string, email: string, password: string) => {
    return apiClient.post('/api/signup', { name, email, password });
  },
  logout: async () => {
    return apiClient.post('/api/auth/logout');
  },
  me: async () => {
    return apiClient.get('/api/auth/me');
  },

  // セッションベースの認証
  sessionLogin: async (email: string, password: string) => {
    return apiClient.post('/api/sessions', { email, password });
  },
  sessionLogout: async () => {
    return apiClient.delete('/api/sessions');
  },
  checkSession: async () => {
    return apiClient.get('/api/sessions/new');
  }
};

export default apiClient; 
