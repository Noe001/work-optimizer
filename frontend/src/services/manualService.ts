import { api } from './api';
import { ApiResponse, Manual, PaginatedResponse } from '../types/api';

// マニュアル一覧取得のパラメータ
export interface ManualListParams {
  page?: number;
  per_page?: number;
  department?: string;
  category?: string;
  query?: string;
  status?: string;
  order_by?: string;
  order?: 'asc' | 'desc';
}

// マニュアル詳細検索のパラメータ
export interface ManualSearchParams {
  page?: number;
  per_page?: number;
  department?: string;
  category?: string;
  query?: string; // 統合検索クエリ（タイトル・内容を含む）
  title?: string;
  content?: string;
  author_id?: string;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  status?: string; // ステータスフィルター
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
    const response = await api.get<PaginatedResponse<Manual>>('/api/manuals', params);
    
    // responseがundefinedまたはsuccessがfalseの場合をチェック
    if (!response || !response.success) {
      throw new Error(response?.message || 'マニュアル一覧の取得に失敗しました');
    }
    
    // バックエンドは {data: [...], meta: {...}} 形式で返すため、標準形式に変換
    return {
      success: true,
      data: response.data,
      message: response.message
    } as ApiResponse<PaginatedResponse<Manual>>;
  }

  // マニュアル詳細検索
  async searchManuals(params?: ManualSearchParams): Promise<ApiResponse<PaginatedResponse<Manual>>> {
    const response = await api.get<PaginatedResponse<Manual>>('/api/manuals/search', params);
    
    // responseがundefinedまたはsuccessがfalseの場合をチェック
    if (!response || !response.success) {
      throw new Error(response?.message || 'マニュアル検索に失敗しました');
    }
    
    return response;
  }

  // ダッシュボード用統計情報取得
  async getStats(): Promise<ApiResponse<{ total: number; published: number; drafts: number; my_manuals: number }>> {
    const response = await api.get<{ total: number; published: number; drafts: number; my_manuals: number }>('/api/manuals/stats');
    
    // responseがundefinedまたはsuccessがfalseの場合をチェック
    if (!response || !response.success) {
      throw new Error(response?.message || 'マニュアル統計の取得に失敗しました');
    }
    
    return response;
  }

  // 自分が作成したマニュアル一覧
  async getMyManuals(params?: { page?: number; per_page?: number; status?: string }): Promise<ApiResponse<PaginatedResponse<Manual>>> {
    const response = await api.get<PaginatedResponse<Manual>>('/api/manuals/my', params);
    
    // responseがundefinedまたはsuccessがfalseの場合をチェック
    if (!response || !response.success) {
      throw new Error(response?.message || '自分のマニュアル一覧の取得に失敗しました');
    }
    
    return response;
  }

  // マニュアル詳細取得
  async getManual(id: string): Promise<ApiResponse<Manual>> {
    if (!id) {
      throw new Error('マニュアルIDが指定されていません');
    }
    
    const response = await api.get<Manual>(`/api/manuals/${id}`);
    
    // responseがundefinedまたはsuccessがfalseの場合をチェック
    if (!response || !response.success) {
      throw new Error(response?.message || 'マニュアルの取得に失敗しました');
    }
    
    return response;
  }

  // マニュアル作成
  async createManual(data: ManualFormData): Promise<ApiResponse<Manual>> {
    const response = await api.post<Manual>('/api/manuals', { manual: data });
    
    // responseがundefinedまたはsuccessがfalseの場合をチェック
    if (!response || !response.success) {
      throw new Error(response?.message || 'マニュアルの作成に失敗しました');
    }
    
    return response;
  }

  // マニュアル更新
  async updateManual(id: string, data: ManualFormData): Promise<ApiResponse<Manual>> {
    const response = await api.patch<Manual>(`/api/manuals/${id}`, { manual: data });
    
    // responseがundefinedまたはsuccessがfalseの場合をチェック
    if (!response || !response.success) {
      throw new Error(response?.message || 'マニュアルの更新に失敗しました');
    }
    
    return response;
  }

  // マニュアル削除
  async deleteManual(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<void>(`/api/manuals/${id}`);
    
    // responseがundefinedまたはsuccessがfalseの場合をチェック
    if (!response || !response.success) {
      throw new Error(response?.message || 'マニュアルの削除に失敗しました');
    }
    
    return response;
  }

  // マニュアル公開
  async publishManual(id: string): Promise<ApiResponse<Manual>> {
    const response = await api.patch<Manual>(`/api/manuals/${id}`, { 
      manual: { status: 'published' } 
    });
    
    // responseがundefinedまたはsuccessがfalseの場合をチェック
    if (!response || !response.success) {
      throw new Error(response?.message || 'マニュアルの公開に失敗しました');
    }
    
    return response;
  }

  // 下書き保存
  async saveDraft(id: string, data: ManualFormData): Promise<ApiResponse<Manual>> {
    const draftData = { ...data, status: 'draft' };
    const response = await api.patch<Manual>(`/api/manuals/${id}`, { manual: draftData });
    
    // responseがundefinedまたはsuccessがfalseの場合をチェック
    if (!response || !response.success) {
      throw new Error(response?.message || '下書きの保存に失敗しました');
    }
    
    return response;
  }

  // マニュアル非公開（下書きに戻す）
  async unpublishManual(id: string): Promise<ApiResponse<Manual>> {
    const response = await api.patch<Manual>(`/api/manuals/${id}`, { 
      manual: { status: 'draft' } 
    });
    
    // responseがundefinedまたはsuccessがfalseの場合をチェック
    if (!response || !response.success) {
      throw new Error(response?.message || 'マニュアルの非公開に失敗しました');
    }
    
    return response;
  }
}

export const manualService = new ManualService();
export default manualService; 
