import { api } from './api';
import { ApiResponse, Manual, PaginatedResponse } from '../types/api';
import { ErrorHandler } from '../utils/errorHandler';

// マニュアル一覧取得のパラメータ
export interface ManualListParams {
  page?: number;
  per_page?: number;
  department?: string;
  category?: string;
  query?: string;
  status?: string;
}

// マニュアル詳細検索のパラメータ
export interface ManualSearchParams {
  page?: number;
  per_page?: number;
  department?: string;
  category?: string;
  title?: string;
  content?: string;
  author_id?: string;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  order_by?: string;
  order?: 'asc' | 'desc';
}

// マニュアル作成・更新用データ
export interface ManualFormData {
  title: string;
  content: string;
  department: string;
  category: string;
  access_level: string;
  edit_permission: string;
  status?: string;
  tags?: string;
}



class ManualService {
  // マニュアル一覧取得
  async getManuals(params?: ManualListParams): Promise<ApiResponse<PaginatedResponse<Manual>>> {
    try {
      const response = await api.get('/api/manuals', { params });
      
      // レスポンス形式をチェック
      const responseData = response.data as any;
      if (responseData.success !== undefined) {
        // 期待される形式: {success: true, data: {...}}
        return responseData as ApiResponse<PaginatedResponse<Manual>>;
      } else if (responseData.data && responseData.meta) {
        // 直接データ形式: {data: [...], meta: {...}}
        return {
          success: true,
          data: responseData
        } as ApiResponse<PaginatedResponse<Manual>>;
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error: any) {
      const message = ErrorHandler.getErrorMessage(error) || 'マニュアル一覧の取得に失敗しました';
      throw new Error(message);
    }
  }

  // マニュアル詳細検索
  async searchManuals(params?: ManualSearchParams): Promise<ApiResponse<PaginatedResponse<Manual>>> {
    try {
      const response = await api.get('/api/manuals/search', { params });
      
      // バックエンドは統一された形式で返す
      return response.data as ApiResponse<PaginatedResponse<Manual>>;
    } catch (error: any) {
      const message = ErrorHandler.getErrorMessage(error) || 'マニュアル検索に失敗しました';
      throw new Error(message);
    }
  }

  // ダッシュボード用統計情報取得
  async getStats(): Promise<ApiResponse<{ total: number; published: number; drafts: number; my_manuals: number }>> {
    try {
      const response = await api.get('/api/manuals/stats');
      return response.data as ApiResponse<{ total: number; published: number; drafts: number; my_manuals: number }>;
    } catch (error: any) {
      const message = ErrorHandler.getErrorMessage(error) || 'マニュアル統計の取得に失敗しました';
      throw new Error(message);
    }
  }

  // 自分が作成したマニュアル一覧
  async getMyManuals(params?: { page?: number; per_page?: number; status?: string }): Promise<ApiResponse<PaginatedResponse<Manual>>> {
    try {
      const response = await api.get('/api/manuals/my', { params });
      
      // バックエンドは統一された形式で返す
      return response.data as ApiResponse<PaginatedResponse<Manual>>;
    } catch (error: any) {
      const message = ErrorHandler.getErrorMessage(error) || '自分のマニュアル取得に失敗しました';
      throw new Error(message);
    }
  }

  // マニュアル詳細取得
  async getManual(id: string): Promise<ApiResponse<Manual>> {
    try {
      const response = await api.get(`/api/manuals/${id}`);
      
      // バックエンドは統一された形式で返す
      return response.data as ApiResponse<Manual>;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'マニュアル詳細の取得に失敗しました');
    }
  }

  // マニュアル作成
  async createManual(data: ManualFormData): Promise<ApiResponse<Manual>> {
    try {
      const response = await api.post('/api/manuals', { manual: data });
      
      // バックエンドは統一された形式で返す
      return response.data as ApiResponse<Manual>;
    } catch (error: any) {
      const message = ErrorHandler.getErrorMessage(error) || 'マニュアルの作成に失敗しました';
      throw new Error(message);
    }
  }

  // マニュアル更新
  async updateManual(id: string, data: ManualFormData): Promise<ApiResponse<Manual>> {
    try {
      const response = await api.patch(`/api/manuals/${id}`, { manual: data });
      
      // バックエンドは統一された形式で返す
      return response.data as ApiResponse<Manual>;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'マニュアルの更新に失敗しました');
    }
  }

  // マニュアル削除
  async deleteManual(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`/api/manuals/${id}`);
      return response.data as ApiResponse<void>;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'マニュアルの削除に失敗しました');
    }
  }

  // マニュアル公開
  async publishManual(id: string): Promise<ApiResponse<Manual>> {
    try {
      const response = await api.patch(`/api/manuals/${id}`, { 
        manual: { status: 'published' } 
      });
      
      // バックエンドは統一された形式で返す
      return response.data as ApiResponse<Manual>;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'マニュアルの公開に失敗しました');
    }
  }

  // 下書き保存
  async saveDraft(id: string, data: ManualFormData): Promise<ApiResponse<Manual>> {
    try {
      const draftData = { ...data, status: 'draft' };
      const response = await api.patch(`/api/manuals/${id}`, { manual: draftData });
      
      // バックエンドは統一された形式で返す
      return response.data as ApiResponse<Manual>;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '下書きの保存に失敗しました');
    }
  }

  // マニュアル非公開（下書きに戻す）
  async unpublishManual(id: string): Promise<ApiResponse<Manual>> {
    try {
      const response = await api.patch(`/api/manuals/${id}`, { 
        manual: { status: 'draft' } 
      });
      
      // バックエンドは統一された形式で返す
      return response.data as ApiResponse<Manual>;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'マニュアルの非公開に失敗しました');
    }
  }
}

export const manualService = new ManualService();
export default manualService; 
