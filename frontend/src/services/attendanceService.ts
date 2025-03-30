import api from './api';
import { ApiResponse, Attendance, LeaveRequest, AttendanceSummary } from '../types/api';
import { AxiosResponse } from 'axios';

/**
 * レスポンスをApiResponse形式に変換
 */
const transformResponse = <T>(response: AxiosResponse<any>): ApiResponse<T> => {
  // APIから返されるレスポンスの構造をチェック
  if (response.data && response.data.data) {
    // バックエンドから返されるレスポンスが { success: true, data: { ... } } の形式の場合
    return {
      success: response.data.success || true,
      data: response.data.data as T,
      message: response.data.message || response.statusText
    };
  }
  
  // 通常のレスポンス（データが直接含まれている場合）
  return {
    success: true,
    data: response.data as T,
    message: response.statusText
  };
};

/**
 * 勤怠管理サービス
 */
const attendanceService = {
  /**
   * 勤怠データを取得
   */
  async getAttendance(): Promise<ApiResponse<Attendance>> {
    try {
      // タイムスタンプを追加してキャッシュを回避
      const timestamp = new Date().getTime();
      const response = await api.get<Attendance>(`/api/attendance?_=${timestamp}`);
      
      // APIレスポンスを構造化
      let formattedResponse: ApiResponse<Attendance>;
      
      // バックエンドから返されるレスポンスの構造に合わせて適切に処理
      if (response.data && typeof response.data === 'object') {
        if ('success' in response.data && 'data' in response.data) {
          // {success: true, data: {...}} の形式
          const backendResponse = response.data as any;
          formattedResponse = {
            success: true,
            data: backendResponse.data as Attendance,
            message: backendResponse.message || 'OK'
          };
        } else {
          // データが直接含まれている場合
          formattedResponse = transformResponse<Attendance>(response);
        }
      } else {
        // 想定外のレスポンス形式
        formattedResponse = transformResponse<Attendance>(response);
      }
      
      return formattedResponse;
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        message: error.response?.data?.message || '勤怠データの取得に失敗しました'
      };
    }
  },

  /**
   * 出勤打刻
   */
  async checkIn(): Promise<ApiResponse<Attendance>> {
    try {
      const response = await api.post<Attendance>('/api/attendance/check-in');
      return transformResponse(response);
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        message: error.response?.data?.message || '出勤打刻に失敗しました'
      };
    }
  },

  /**
   * 退勤打刻
   */
  async checkOut(): Promise<ApiResponse<Attendance>> {
    try {
      const response = await api.post<Attendance>('/api/attendance/check-out');
      return transformResponse(response);
    } catch (error: any) {
      let errorMessage = '退勤打刻に失敗しました';
      
      // エラーレスポンスからより詳細な情報を取得
      if (error.response) {
        if (error.response.status === 422) {
          // バリデーションエラー
          errorMessage = error.response.data.message || 
                         '退勤時刻は出勤時刻より後でなければなりません';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      console.error('退勤打刻エラー詳細:', error.response?.data);
      
      return {
        success: false,
        data: null as any,
        message: errorMessage
      };
    }
  },

  /**
   * 勤怠記録の更新
   * @param attendanceData 更新する勤怠データ
   */
  async updateAttendance(attendanceData: {
    date?: string,
    check_in?: string,
    check_out?: string,
    status?: string,
    comment?: string
  }): Promise<ApiResponse<Attendance>> {
    const response = await api.put<Attendance>('/api/attendance', attendanceData);
    return transformResponse(response);
  },

  /**
   * 特定日の勤怠記録を更新
   * @param date 日付
   * @param attendanceData 更新する勤怠データ
   */
  async updateAttendanceByDate(date: string, attendanceData: {
    check_in?: string,
    check_out?: string,
    status?: string,
    comment?: string
  }): Promise<ApiResponse<Attendance>> {
    const response = await api.put<Attendance>('/api/attendance', {
      date,
      ...attendanceData
    });
    return transformResponse(response);
  },

  /**
   * 休暇申請
   * @param leaveData 休暇データ
   */
  async requestLeave(leaveData: {
    leave_type: 'paid' | 'sick' | 'other',
    start_date: string,
    end_date: string,
    reason: string
  }): Promise<ApiResponse<LeaveRequest>> {
    const response = await api.post<LeaveRequest>('/api/attendance/leave', leaveData);
    return transformResponse(response);
  },

  /**
   * 勤怠履歴を取得
   * @param period 期間（日次、週次、月次）
   * @param dateFrom 開始日
   * @param dateTo 終了日
   */
  async getAttendanceHistory(
    period: 'daily' | 'weekly' | 'monthly',
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<any>> {
    const params: any = { period };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    
    const response = await api.get<any>(`/api/attendance/history`, { params });
    return transformResponse(response);
  },

  /**
   * 休暇申請履歴を取得
   */
  async getLeaveHistory(): Promise<ApiResponse<LeaveRequest[]>> {
    const response = await api.get<LeaveRequest[]>('/api/attendance/leave-history');
    return transformResponse(response);
  },

  /**
   * 勤怠サマリーを取得
   */
  async getAttendanceSummary(): Promise<ApiResponse<AttendanceSummary>> {
    const response = await api.get<AttendanceSummary>('/api/attendance/summary');
    return transformResponse(response);
  }
};

export default attendanceService; 
