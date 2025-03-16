import { useState, useCallback, useEffect } from 'react';
import { ApiResponse, PaginatedResponse } from '@/types/api';

/**
 * ページネーション付きAPIリクエストを管理するカスタムフック
 * @param fetchFunction APIからデータを取得する関数
 * @param initialParams 初期検索パラメータ（オプション）
 */
export function usePaginatedApi<T>(
  fetchFunction: (page: number, perPage: number, params?: Record<string, any>) => Promise<ApiResponse<PaginatedResponse<T>>>,
  initialParams: Record<string, any> = {}
) {
  // 状態管理
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [params, setParams] = useState(initialParams);

  // リクエストパラメータが変更されたときにデータをリセット
  useEffect(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
  }, [JSON.stringify(params)]);

  // データ取得関数
  const fetchData = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);

    try {
      const currentPage = reset ? 1 : page;
      const response = await fetchFunction(currentPage, 10, params);

      if (response.success) {
        // 新しいページ1の場合はデータをリセット、それ以外は追加
        setData(prevData => {
          if (reset || currentPage === 1) {
            return response.data.data;
          } else {
            return [...prevData, ...response.data.data];
          }
        });

        // 次のページがあるかどうか
        setHasMore(response.data.meta.current_page < response.data.meta.last_page);
        
        // ページ番号を更新
        setPage(currentPage + 1);
      } else {
        setError(response.message || 'データの取得に失敗しました');
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'データの取得中にエラーが発生しました';
      
      setError(errorMessage);
      console.error('API error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, page, params]);

  // パラメータを更新して最初のページからデータを再取得
  const updateParams = useCallback((newParams: Record<string, any>) => {
    setParams(currentParams => ({
      ...currentParams,
      ...newParams
    }));
  }, []);

  // エラー状態をリセット
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // すべての状態をリセット
  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setLoading(false);
    setError(null);
    setHasMore(true);
    setParams(initialParams);
  }, [initialParams]);

  return {
    data,
    loading,
    error,
    hasMore,
    fetchData,
    updateParams,
    resetError,
    reset,
    params
  };
}

export default usePaginatedApi; 
