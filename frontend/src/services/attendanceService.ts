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
   * 休暇申請
   * @param leaveData 休暇データ
   */
  async requestLeave(leaveData: {
    type: 'paid' | 'sick' | 'other',
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
   */
  async getAttendanceHistory(
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<ApiResponse<any>> {
    const response = await api.get<any>(`/api/attendance/history`, { 
      params: { period } 
    });
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
