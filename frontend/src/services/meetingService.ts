import api from './api';
import { ApiResponse, Meeting, PaginatedResponse } from '../types/api';

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
    return api.get<PaginatedResponse<Meeting>>('/meetings', { page, per_page: perPage });
  },

  /**
   * 特定のミーティングを取得
   * @param id ミーティングID
   */
  async getMeeting(id: number): Promise<ApiResponse<Meeting>> {
    return api.get<Meeting>(`/meetings/${id}`);
  },

  /**
   * ミーティングを作成
   * @param meetingData ミーティングデータ
   */
  async createMeeting(meetingData: MeetingData): Promise<ApiResponse<Meeting>> {
    return api.post<Meeting>('/meetings', meetingData);
  },

  /**
   * ミーティングを更新
   * @param id ミーティングID
   * @param meetingData 更新するミーティングデータ
   */
  async updateMeeting(id: number, meetingData: Partial<MeetingData>): Promise<ApiResponse<Meeting>> {
    return api.put<Meeting>(`/meetings/${id}`, meetingData);
  },

  /**
   * ミーティングを削除
   * @param id ミーティングID
   */
  async deleteMeeting(id: number): Promise<ApiResponse<null>> {
    return api.delete<null>(`/meetings/${id}`);
  },
  
  /**
   * 自分の参加するミーティング一覧を取得
   */
  async getMyMeetings(): Promise<ApiResponse<Meeting[]>> {
    return api.get<Meeting[]>('/meetings/my');
  },
  
  /**
   * ミーティングの参加者を追加
   * @param meetingId ミーティングID
   * @param userIds 追加するユーザーIDのリスト
   */
  async addParticipants(meetingId: number, userIds: string[]): Promise<ApiResponse<null>> {
    return api.post<null>(`/meetings/${meetingId}/participants`, { user_ids: userIds });
  },
  
  /**
   * ミーティングの参加者を削除
   * @param meetingId ミーティングID
   * @param userId 削除するユーザーID
   */
  async removeParticipant(meetingId: number, userId: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/meetings/${meetingId}/participants/${userId}`);
  }
};

export default meetingService; 
