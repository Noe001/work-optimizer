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

// ワークライフバランス関連の型
export interface WorkLifeBalance {
  id: number;
  score: number;
  status: 'good' | 'warning' | 'bad';
  lastUpdated: string;
  recommendations: string[];
  stressFactors: {
    factor: string;
    level: string;
    recommendations: string[];
  }[];
  wellnessIndicators: {
    name: string;
    value: number;
    target: number;
  }[];
} 
