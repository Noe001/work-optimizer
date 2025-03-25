import api from './api';
import { ApiResponse, Meeting, PaginatedResponse } from '../types/api';
import { AxiosResponse } from 'axios';

// レスポンスをApiResponse形式に変換
const transformResponse = <T>(response: AxiosResponse<T>): ApiResponse<T> => {
  return {
    success: true,
    data: response.data,
    message: response.statusText
  };
};

// ミーティング作成/更新用のデータ型
interface MeetingData {
  title: string;
  scheduledTime: string;
  duration?: number;
  location?: string;
  description?: string;
  participants?: string[];
  agenda?: { topic: string; duration: number }[];
}

/**
 * ミーティング管理サービス
 */
const meetingService = {
  /**
   * ミーティング一覧を取得
   * @param page ページ番号
   * @param perPage 1ページあたりの件数
   */
  async getMeetings(page = 1, perPage = 10): Promise<ApiResponse<PaginatedResponse<Meeting>>> {
    const response = await api.get<PaginatedResponse<Meeting>>('/api/meetings', { 
      params: { page, per_page: perPage } 
    });
    return transformResponse(response);
  },

  /**
   * 特定のミーティングを取得
   * @param id ミーティングID
   */
  async getMeeting(id: number): Promise<ApiResponse<Meeting>> {
    const response = await api.get<Meeting>(`/api/meetings/${id}`);
    return transformResponse(response);
  },

  /**
   * ミーティングを作成
   * @param meetingData ミーティングデータ
   */
  async createMeeting(meetingData: MeetingData): Promise<ApiResponse<Meeting>> {
    const response = await api.post<Meeting>('/api/meetings', meetingData);
    return transformResponse(response);
  },

  /**
   * ミーティングを更新
   * @param id ミーティングID
   * @param meetingData 更新するミーティングデータ
   */
  async updateMeeting(id: number, meetingData: Partial<MeetingData>): Promise<ApiResponse<Meeting>> {
    const response = await api.put<Meeting>(`/api/meetings/${id}`, meetingData);
    return transformResponse(response);
  },

  /**
   * ミーティングを削除
   * @param id ミーティングID
   */
  async deleteMeeting(id: number): Promise<ApiResponse<null>> {
    const response = await api.delete<null>(`/api/meetings/${id}`);
    return transformResponse(response);
  },
  
  /**
   * 自分の参加するミーティング一覧を取得
   */
  async getMyMeetings(): Promise<ApiResponse<Meeting[]>> {
    const response = await api.get<Meeting[]>('/api/meetings/my');
    return transformResponse(response);
  },
  
  /**
   * ミーティングの参加者を追加
   * @param meetingId ミーティングID
   * @param userIds 追加するユーザーIDのリスト
   */
  async addParticipants(meetingId: number, userIds: string[]): Promise<ApiResponse<null>> {
    const response = await api.post<null>(`/api/meetings/${meetingId}/participants`, { user_ids: userIds });
    return transformResponse(response);
  },
  
  /**
   * ミーティングの参加者を削除
   * @param meetingId ミーティングID
   * @param userId 削除するユーザーID
   */
  async removeParticipant(meetingId: number, userId: string): Promise<ApiResponse<null>> {
    const response = await api.delete<null>(`/api/meetings/${meetingId}/participants/${userId}`);
    return transformResponse(response);
  }
};

export default meetingService; 
