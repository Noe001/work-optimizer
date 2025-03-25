import api from './api';
import { ApiResponse, Attendance, LeaveRequest, AttendanceSummary } from '../types/api';
import { AxiosResponse } from 'axios';

/**
 * レスポンスをApiResponse形式に変換
 */
const transformResponse = <T>(response: AxiosResponse<T>): ApiResponse<T> => {
  return {
    success: true,
    data: response.data,
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
    const response = await api.get<Attendance>('/api/attendance');
    return transformResponse(response);
  },

  /**
   * 出勤打刻
   */
  async checkIn(): Promise<ApiResponse<Attendance>> {
    const response = await api.post<Attendance>('/api/attendance/check-in');
    return transformResponse(response);
  },

  /**
   * 退勤打刻
   */
  async checkOut(): Promise<ApiResponse<Attendance>> {
    const response = await api.post<Attendance>('/api/attendance/check-out');
    return transformResponse(response);
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
