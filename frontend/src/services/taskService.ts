import api from './api';
import { ApiResponse, Task, PaginatedResponse } from '../types/api';

// タスク作成/更新用のデータ型
interface TaskData {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  assigned_to?: string;
  tags?: string[];
}

/**
 * タスク管理サービス
 */
const taskService = {
  /**
   * タスク一覧を取得
   * @param page ページ番号
   * @param perPage 1ページあたりの件数
   * @param filters フィルタ条件
   */
  async getTasks(page = 1, perPage = 10, filters?: Record<string, any>): Promise<ApiResponse<PaginatedResponse<Task>>> {
    return api.get<PaginatedResponse<Task>>('/api/tasks', { 
      page, 
      per_page: perPage,
      ...filters
    });
  },

  /**
   * 特定のタスクを取得
   * @param id タスクID
   */
  async getTask(id: number): Promise<ApiResponse<Task>> {
    return api.get<Task>(`/api/tasks/${id}`);
  },

  /**
   * タスクを作成
   * @param taskData タスクデータ
   */
  async createTask(taskData: TaskData): Promise<ApiResponse<Task>> {
    return api.post<Task>('/api/tasks', taskData);
  },

  /**
   * タスクを更新
   * @param id タスクID
   * @param taskData 更新するタスクデータ
   */
  async updateTask(id: number, taskData: Partial<TaskData>): Promise<ApiResponse<Task>> {
    return api.put<Task>(`/api/tasks/${id}`, taskData);
  },

  /**
   * タスクを削除
   * @param id タスクID
   */
  async deleteTask(id: number): Promise<ApiResponse<null>> {
    return api.delete<null>(`/api/tasks/${id}`);
  },
  
  /**
   * 自分のタスク一覧を取得
   */
  async getMyTasks(): Promise<ApiResponse<Task[]>> {
    return api.get<Task[]>('/api/tasks/my');
  },
  
  /**
   * タスクのステータスを更新
   * @param id タスクID
   * @param status 新しいステータス
   */
  async updateTaskStatus(id: number, status: 'pending' | 'in_progress' | 'completed'): Promise<ApiResponse<Task>> {
    return api.put<Task>(`/api/tasks/${id}/status`, { status });
  },
  
  /**
   * タスクの担当者を変更
   * @param id タスクID
   * @param userId 新しい担当者のID
   */
  async assignTask(id: number, userId: string): Promise<ApiResponse<Task>> {
    return api.put<Task>(`/api/tasks/${id}/assign`, { user_id: userId });
  },
  
  /**
   * タスクにコメントを追加
   * @param taskId タスクID
   * @param comment コメント内容
   */
  async addComment(taskId: number, comment: string): Promise<ApiResponse<any>> {
    return api.post<any>(`/api/tasks/${taskId}/comments`, { content: comment });
  }
};

export default taskService; 
