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
  subtasks?: {id: string | number; title: string; completed: boolean}[];
  attachments?: File[];
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
   * タスクを作成（添付ファイル対応）
   * @param taskData タスクデータ
   */
  async createTask(taskData: TaskData): Promise<ApiResponse<Task>> {
    try {
      const formData = createTaskFormData(taskData);
      const response = await api.post<any>('/api/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response && response.data) {
        return response.data;
      }
      
      throw new Error('無効なレスポンス形式');
    } catch (error) {
      console.error('タスク作成エラー:', error);
      throw error;
    }
  },

  /**
   * タスクを更新（添付ファイル対応）
   * @param id タスクID
   * @param taskData 更新するタスクデータ
   */
  async updateTask(id: string, taskData: TaskData): Promise<ApiResponse<Task>> {
    try {
      console.log(`タスク更新リクエスト: ID=${id}`);
      
      // FormDataを作成
      const formData = new FormData();
      
      // _methodパラメータを先頭に追加（重要）
      formData.append('_method', 'patch');
      
      // その他のフィールドを追加
      if (taskData.title) formData.append('task[title]', taskData.title);
      if (taskData.description !== undefined) formData.append('task[description]', taskData.description);
      if (taskData.status) formData.append('task[status]', taskData.status);
      if (taskData.priority) formData.append('task[priority]', taskData.priority);
      if (taskData.due_date) formData.append('task[due_date]', taskData.due_date);
      if (taskData.assigned_to) formData.append('task[assigned_to]', taskData.assigned_to);
      if (taskData.tags) formData.append('task[tags]', taskData.tags);
      
      // サブタスク
      if (taskData.subtasks && taskData.subtasks.length > 0) {
        formData.append('task[subtasks]', JSON.stringify(taskData.subtasks));
      }
      
      // 添付ファイル
      if (taskData.attachments && taskData.attachments.length > 0) {
        taskData.attachments.forEach(file => {
          formData.append('task[attachments][]', file);
        });
      }
      
      // 直接POSTリクエストを送信
      const response = await api.post<any>(`/api/tasks/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('タスク更新レスポンス:', response);
      
      if (response && response.success) {
        return response;
      }
      
      throw new Error(response?.message || '無効なレスポンス形式');
    } catch (error) {
      console.error('タスク更新エラー:', error);
      throw error;
    }
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

/**
 * タスクの進捗度を計算するヘルパー関数
 * @param task 進捗度を計算するタスク
 * @returns 0から100の間の進捗度
 */
export const getTaskProgress = (task: Task): number => {
  // タスクが完了している場合は100%
  if (task.status === 'completed') return 100;
  
  // サブタスクがある場合は、完了したサブタスクの割合を計算
  if (task.subtasks && task.subtasks.length > 0) {
    const completedSubtasks = task.subtasks.filter(subtask => 
      subtask.status === 'completed' || (subtask as any).completed === true
    ).length;
    return Math.round((completedSubtasks / task.subtasks.length) * 100);
  }
  
  // 進行中のタスクで、サブタスクがない場合は50%とする
  if (task.status === 'in_progress') return 50;
  
  // それ以外の場合（未着手など）は0%
  return 0;
};

// FormDataを作成するヘルパー関数
const createTaskFormData = (taskData: TaskData): FormData => {
  const formData = new FormData();
  
  // 通常のフィールド
  if (taskData.title) formData.append('task[title]', taskData.title);
  if (taskData.description) formData.append('task[description]', taskData.description);
  if (taskData.status) formData.append('task[status]', taskData.status);
  if (taskData.priority) formData.append('task[priority]', taskData.priority);
  if (taskData.due_date) formData.append('task[due_date]', taskData.due_date);
  if (taskData.assigned_to) formData.append('task[assigned_to]', taskData.assigned_to);
  if (taskData.tags) formData.append('task[tags]', taskData.tags);
  if (taskData.organization_id) formData.append('task[organization_id]', taskData.organization_id);
  if (taskData.parent_task_id) formData.append('task[parent_task_id]', taskData.parent_task_id);
  
  // サブタスク
  if (taskData.subtasks && taskData.subtasks.length > 0) {
    formData.append('task[subtasks]', JSON.stringify(taskData.subtasks));
  }
  
  // 添付ファイル
  if (taskData.attachments && taskData.attachments.length > 0) {
    taskData.attachments.forEach(file => {
      formData.append('task[attachments][]', file);
    });
  }
  
  return formData;
}; 
