/**
 * APIレスポンスの基本的な型定義
 */

// APIレスポンス共通インターフェース
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
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
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
  organization_id?: string;
  parent_task_id?: string;  // 親タスクID
  created_at: string;
  updated_at: string;
  tags?: string | string[];  // タグ文字列またはタグ配列
  tag_list?: string | string[];  // タグリスト（APIによって返される形式が異なる場合）
  assignee_name?: string;
  is_overdue?: boolean;
  is_completed?: boolean;
  time_remaining?: number;
  subtasks?: Task[];  // サブタスク配列
}

// サブタスク関連の型（フロントエンドでのフォーム用）
export interface SubTask {
  id?: string | number;
  title: string;
  completed: boolean;
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
  leave_type: 'paid' | 'sick' | 'other';
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
