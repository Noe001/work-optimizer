/**
 * APIレスポンスの基本的な型定義
 */

// APIレスポンス共通インターフェース
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// エラーレスポンスの型
export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// ページネーション用の型
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ユーザー関連の型
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

// ミーティング関連の型
export interface Meeting {
  id: number;
  title: string;
  scheduledTime: string;
  participants: number;
  agenda: { topic: string; duration: number }[];
}

// タスク関連の型
export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

// マニュアル関連の型
export interface Manual {
  id: number;
  title: string;
  content: string;
  department: string;
  category: string;
  access_level: string;
  edit_permission: string;
  created_at: string;
  updated_at: string;
}

// 勤怠管理関連の型
export interface Attendance {
  id: number;
  user_id: string;
  date: string;
  check_in: string;
  check_out: string | null;
  total_hours: number | null;
  overtime_hours: number | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'holiday' | 'good' | 'warning' | 'bad';
  score?: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: number;
  user_id: string;
  type: 'paid' | 'sick' | 'other';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  total_hours: number;
  total_overtime: number;
  leave_balance: {
    paid: number;
    sick: number;
  };
} 
