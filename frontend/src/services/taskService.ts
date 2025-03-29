import { api } from './api';
import { ApiResponse, Task, PaginatedResponse, SubTask } from '../types/api';

// タスク作成/更新用のデータ型
interface TaskData {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  assigned_to?: string | null;
  tags?: string;
  organization_id?: string;
  parent_task_id?: string;
  subtasks?: SubTask[];
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
    const response = await api.get<any>('/api/tasks', { 
      page, 
      per_page: perPage,
      ...filters
    });

    // APIレスポンスの構造を調整
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          data: response.data.data,
          meta: {
            current_page: response.data.meta.current_page,
            last_page: response.data.meta.total_pages,
            per_page: response.data.meta.per_page,
            total: response.data.meta.total_count
          }
        },
        message: response.message
      };
    }
    
    return response;
  },

  /**
   * 特定のタスクを取得
   * @param id タスクID
   */
  async getTask(id: string): Promise<ApiResponse<Task>> {
    const response = await api.get<any>(`/api/tasks/${id}`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.message
      };
    }
    
    return response;
  },

  /**
   * タスクを作成
   * @param taskData タスクデータ
   */
  async createTask(taskData: TaskData): Promise<ApiResponse<Task>> {
    const response = await api.post<any>('/api/tasks', { task: taskData });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.message
      };
    }
    
    return response;
  },

  /**
   * タスクを更新
   * @param id タスクID
   * @param taskData 更新するタスクデータ
   */
  async updateTask(id: string, taskData: Partial<TaskData>): Promise<ApiResponse<Task>> {
    const response = await api.put<any>(`/api/tasks/${id}`, { task: taskData });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.message
      };
    }
    
    return response;
  },

  /**
   * タスクを削除
   * @param id タスクID
   */
  async deleteTask(id: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/api/tasks/${id}`);
  },
  
  /**
   * 自分のタスク一覧を取得
   */
  async getMyTasks(): Promise<ApiResponse<Task[]>> {
    const response = await api.get<any>('/api/tasks/my');
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.message
      };
    }
    
    return response;
  },
  
  /**
   * タスクのステータスを更新
   * @param id タスクID
   * @param status 新しいステータス
   */
  async updateTaskStatus(id: string, status: 'pending' | 'in_progress' | 'completed'): Promise<ApiResponse<Task>> {
    const response = await api.put<any>(`/api/tasks/${id}/status`, { status });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.message
      };
    }
    
    return response;
  },
  
  /**
   * タスクの担当者を変更
   * @param id タスクID
   * @param userId 新しい担当者のID
   */
  async assignTask(id: string, userId: string): Promise<ApiResponse<Task>> {
    const response = await api.put<any>(`/api/tasks/${id}/assign`, { user_id: userId });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.message
      };
    }
    
    return response;
  },
  
  /**
   * ダッシュボード用のタスク統計情報を取得
   */
  async getTasksDashboard(): Promise<ApiResponse<any>> {
    const response = await api.get<any>('/api/tasks/dashboard');
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.message
      };
    }
    
    return response;
  },
  
  /**
   * カレンダービュー用のタスクデータを取得
   */
  async getTasksCalendar(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const response = await api.get<any>('/api/tasks/calendar', {
      start_date: startDate,
      end_date: endDate
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.message
      };
    }
    
    return response;
  },
  
  /**
   * 複数タスクを一括更新
   */
  async batchUpdateTasks(tasks: Array<{id: string} & Partial<TaskData>>): Promise<ApiResponse<any>> {
    return api.post<any>('/api/tasks/batch_update', { tasks });
  },
  
  /**
   * タスクの並び替え
   */
  async reorderTasks(taskIds: string[]): Promise<ApiResponse<any>> {
    return api.put<any>('/api/tasks/reorder', { task_ids: taskIds });
  },
  
  /**
   * サブタスクの完了状態を切り替える
   * @param taskId 親タスクID
   * @param subtaskId サブタスクID
   */
  async toggleSubtaskStatus(taskId: string, subtaskId: string): Promise<ApiResponse<{subtask: Task, parent_task: Task}>> {
    const response = await api.put<any>(`/api/tasks/${taskId}/subtask/${subtaskId}/toggle`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.message
      };
    }
    
    return response;
  }
};

export default taskService; 
