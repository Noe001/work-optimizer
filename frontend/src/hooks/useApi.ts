import { useState, useCallback } from 'react';
import { ApiError } from '@/types/api';

/**
 * API操作の状態を管理するためのカスタムフック
 * ローディング状態、エラー状態、データ取得などを一元管理します
 */
export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * API呼び出しを実行する関数
   * @param apiCall APIサービスの関数（Promise）
   * @param onSuccess 成功時のコールバック（オプション）
   * @param onError エラー時のコールバック（オプション）
   */
  const execute = useCallback(async <R>(
    apiCall: () => Promise<R>,
    onSuccess?: (result: R) => void,
    onError?: (error: ApiError | Error) => void
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      setData(result as unknown as T);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      // エラーハンドリング
      const errorMessage = err instanceof Error 
        ? err.message 
        : '操作中にエラーが発生しました';
      
      setError(errorMessage);
      
      if (onError) {
        onError(err as ApiError | Error);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * エラー状態をリセットする
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 状態を完全にリセットする
   */
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    resetError,
    reset,
    setData,
  };
}

export default useApi; 
