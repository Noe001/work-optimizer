import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError, ApiResponse } from '../types/api';

// 開発環境と本番環境でベースURLを切り替え
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Axiosインスタンスの作成
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10秒でタイムアウト
});

// リクエストインターセプター
apiClient.interceptors.request.use(
  (config) => {
    // ローカルストレージからトークンを取得
    const token = localStorage.getItem('auth_token');
    
    // トークンがあればヘッダーに追加
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
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // 401エラー（認証エラー）時の処理
    if (error.response?.status === 401) {
      // ローカルストレージをクリア
      localStorage.removeItem('auth_token');
      
      // ログインページへリダイレクト
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

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
      const response = await apiClient.get<ApiResponse<T>>(url, { 
        params, 
        ...config 
      });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<ApiError>);
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
      const response = await apiClient.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<ApiError>);
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
      const response = await apiClient.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<ApiError>);
    }
  },

  /**
   * DELETEリクエスト
   * @param url エンドポイントURL
   * @param config Axiosリクエスト設定
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError<ApiError>);
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
  
  // カスタムエラーオブジェクト
  const apiError: ApiError = {
    message: errorMessage,
    code: errorCode,
    errors: errorDetails,
  };
  
  // エラーをコンソールに出力（開発時のみ）
  if (import.meta.env.DEV) {
    console.error('API Error:', apiError);
  }
  
  throw apiError;
};

export default api; 
