import { api } from './api';
import { ApiResponse, Manual, PaginatedResponse } from '../types/api';

// マニュアル一覧取得のパラメータ
export interface ManualListParams {
  page?: number;
  per_page?: number;
  department?: string;
  category?: string;
  query?: string;
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

// JSONAPI形式のレスポンスデータ変換ユーティリティ
const transformManualData = (jsonApiData: any): Manual => {
  // バックエンドからフラットな形式で返される場合はそのまま返す
  if (jsonApiData && typeof jsonApiData === 'object' && jsonApiData.id) {
    return jsonApiData as Manual;
  }
  
  // JSONAPI形式の場合は従来通り変換
  const { id, attributes } = jsonApiData;
  return {
    id,
    ...attributes
  };
};

class ManualService {
  // マニュアル一覧取得
  async getManuals(params?: ManualListParams): Promise<ApiResponse<PaginatedResponse<Manual>>> {
    try {
      const response = await api.get('/api/manuals', { params });
      const apiResponse = response.data as ApiResponse<PaginatedResponse<Manual>>;
      
      if (apiResponse.success && apiResponse.data) {
        // データが既にフラット形式の場合はそのまま使用
        const manuals = apiResponse.data.data;
        const transformedData = {
          data: manuals, // 変換不要
          meta: apiResponse.data.meta
        };
        
        return {
          ...apiResponse,
          data: transformedData
        };
      }
      
      return apiResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'マニュアル一覧の取得に失敗しました');
    }
  }

  // マニュアル詳細検索
  async searchManuals(params?: ManualSearchParams): Promise<ApiResponse<PaginatedResponse<Manual>>> {
    try {
      const response = await api.get('/api/manuals/search', { params });
      const apiResponse = response.data as ApiResponse<PaginatedResponse<Manual>>;
      
      if (apiResponse.success && apiResponse.data) {
        // データが既にフラット形式の場合はそのまま使用
        const manuals = apiResponse.data.data;
        const transformedData = {
          data: manuals, // 変換不要
          meta: apiResponse.data.meta
        };
        
        return {
          ...apiResponse,
          data: transformedData
        };
      }
      
      return apiResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'マニュアル検索に失敗しました');
    }
  }

  // 自分が作成したマニュアル一覧
  async getMyManuals(params?: { page?: number; per_page?: number; status?: string }): Promise<ApiResponse<PaginatedResponse<Manual>>> {
    try {
      const response = await api.get('/api/manuals/my', { params });
      const apiResponse = response.data as ApiResponse<PaginatedResponse<Manual>>;
      
      if (apiResponse.success && apiResponse.data) {
        // データが既にフラット形式の場合はそのまま使用
        const manuals = apiResponse.data.data;
        const transformedData = {
          data: manuals, // 変換不要
          meta: apiResponse.data.meta
        };
        
        return {
          ...apiResponse,
          data: transformedData
        };
      }
      
      return apiResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '自分のマニュアル取得に失敗しました');
    }
  }

  // マニュアル詳細取得
  async getManual(id: string): Promise<ApiResponse<Manual>> {
    try {
      const response = await api.get(`/api/manuals/${id}`);
      const apiResponse = response.data as ApiResponse<Manual>;
      
      if (apiResponse.success && apiResponse.data) {
        // データが既にフラット形式の場合はそのまま使用
        return {
          ...apiResponse,
          data: apiResponse.data // 変換不要
        };
      }
      
      return apiResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'マニュアル詳細の取得に失敗しました');
    }
  }

  // マニュアル作成
  async createManual(data: ManualFormData): Promise<ApiResponse<Manual>> {
    try {
      console.log('=== manualService.createManual ===');
      console.log('送信データ:', data);
      console.log('APIエンドポイント: POST /api/manuals');
      console.log('リクエストボディ:', { manual: data });
      
      const response = await api.post('/api/manuals', { manual: data });
      console.log('APIレスポンス:', response);
      
      const apiResponse = response.data as ApiResponse<Manual>;
      
      if (apiResponse.success && apiResponse.data) {
        const transformedData = transformManualData(apiResponse.data);
        console.log('変換後データ:', transformedData);
        
        return {
          ...apiResponse,
          data: transformedData
        };
      }
      
      console.log('APIレスポンス（成功フラグfalse）:', apiResponse);
      return apiResponse;
    } catch (error: any) {
      console.error('=== manualService.createManual エラー ===');
      console.error('エラーオブジェクト:', error);
      console.error('レスポンスデータ:', error.response?.data);
      console.error('レスポンスステータス:', error.response?.status);
      console.error('リクエスト設定:', error.config);
      throw new Error(error.response?.data?.message || 'マニュアルの作成に失敗しました');
    }
  }

  // マニュアル更新
  async updateManual(id: string, data: ManualFormData): Promise<ApiResponse<Manual>> {
    try {
      const response = await api.patch(`/api/manuals/${id}`, { manual: data });
      const apiResponse = response.data as ApiResponse<Manual>;
      
      if (apiResponse.success && apiResponse.data) {
        const transformedData = transformManualData(apiResponse.data);
        
        return {
          ...apiResponse,
          data: transformedData
        };
      }
      
      return apiResponse;
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
      const apiResponse = response.data as ApiResponse<Manual>;
      
      if (apiResponse.success && apiResponse.data) {
        const transformedData = transformManualData(apiResponse.data);
        
        return {
          ...apiResponse,
          data: transformedData
        };
      }
      
      return apiResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'マニュアルの公開に失敗しました');
    }
  }

  // 下書き保存
  async saveDraft(id: string, data: ManualFormData): Promise<ApiResponse<Manual>> {
    try {
      const draftData = { ...data, status: 'draft' };
      const response = await api.patch(`/api/manuals/${id}`, { manual: draftData });
      const apiResponse = response.data as ApiResponse<Manual>;
      
      if (apiResponse.success && apiResponse.data) {
        const transformedData = transformManualData(apiResponse.data);
        
        return {
          ...apiResponse,
          data: transformedData
        };
      }
      
      return apiResponse;
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
      const apiResponse = response.data as ApiResponse<Manual>;
      
      if (apiResponse.success && apiResponse.data) {
        const transformedData = transformManualData(apiResponse.data);
        
        return {
          ...apiResponse,
          data: transformedData
        };
      }
      
      return apiResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'マニュアルの非公開に失敗しました');
    }
  }
}

export const manualService = new ManualService();
export default manualService; 
