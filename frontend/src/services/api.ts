import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError, ApiResponse } from '../types/api';

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
      triggerAuthError({
        message: error.message,
        status: error.response.status,
        statusText: error.response.statusText
      });
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
      console.error('POST request failed:', error.message);
      return {
        success: false,
        message: error.message || 'リクエストに失敗しました',
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
      console.error('PUT request failed:', error.message);
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
      console.error('PATCH request failed:', error.message);
       // エラーレスポンスの詳細を取得しようと試みる
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
      const errors = error.response?.data?.errors;
      console.error('Server Error Details:', errors);
      return {
        success: false,
        message: `Request failed with status code ${error.response?.status || 'unknown'}: ${message}`,
        data: null as any
      };
    }
  },
};

/**
 * APIエラーハンドリング
 * @export 外部からも利用可能
 */
export const handleApiError = (error: AxiosError<ApiError>): never => {
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
    console.error('Token authentication error', errorMessage);
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
    try {
      const response = await apiClient.post('/api/login', { email, password });
      
      // ログイン成功時にトークンをヘッダーに設定
      if (response.data && response.data.success && response.data.data.token) {
        const token = response.data.data.token;
        // 次回以降のリクエストのためにトークンを設定
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      return response;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  
  signup: async (name: string, email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/signup', { 
        name, 
        email, 
        password,
        password_confirmation: password 
      });
      
      // サインアップ成功時にトークンをヘッダーに設定
      if (response.data && response.data.success && response.data.data.token) {
        const token = response.data.data.token;
        // 次回以降のリクエストのためにトークンを設定
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      return response;
    } catch (error) {
      console.error('Signup API error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await apiClient.post('/api/auth/logout');
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
