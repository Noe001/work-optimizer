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

// FormDataを作成するヘルパー関数 (createTask用)
const createTaskFormData = (taskData: TaskData): FormData => {
  const formData = new FormData();
  Object.entries(taskData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === 'attachments' && Array.isArray(value)) {
        // 空でないファイルのみを添付
        value.filter((file: File) => file && typeof file === 'object' && 'size' in file && file.size > 0)
             .forEach((file: File) => formData.append(`task[${key}][]`, file));
      } else if (key === 'subtasks' && Array.isArray(value)) {
        formData.append(`task[${key}]`, JSON.stringify(value));
      } else if (key === 'assigned_to' && value === null) {
         // Do not append null assigned_to, backend handles this
      } else {
        formData.append(`task[${key}]`, String(value));
      }
    }
  });
  return formData;
};

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
    if (response.success && response.data && response.data.data && response.data.meta) {
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
    } else if (response.success && response.data) {
      // Handle cases where response might not have nested data/meta (adjust as needed)
      console.warn("Unexpected response structure in getTasks:", response.data);
      // Attempt to return data if it's an array, otherwise return failure
      if (Array.isArray(response.data)) {
        return { 
          success: true, 
          data: { data: response.data as Task[], meta: { current_page: 1, last_page: 1, per_page: response.data.length, total: response.data.length } }, 
          message: response.message 
        };
      } else {
         return { ...response, success: false, message: response.message || "Failed to parse tasks data" };
      }
    } 
    
    return { ...response, success: false }; // Ensure success: false if structure is wrong
  },

  /**
   * 特定のタスクを取得
   * @param id タスクID
   */
  async getTask(id: string): Promise<ApiResponse<Task>> {
    const response = await api.get<any>(`/api/tasks/${id}`);
    
    // デバッグログを追加
    console.log('getTask API response:', response);
    if (response.success && response.data) {
      console.log('getTask data structure:', response.data);
      console.log('getTask response type:', typeof response.data);
      
      let finalData: Task;
      
      if (response.data.data) {
        console.log('getTask nested data: data内にdataキーが存在します');
        console.log('getTask nested attachments:', response.data.data.attachment_urls);
        finalData = response.data.data as Task;
      } else {
        console.log('getTask direct data: dataキーが直接データを格納しています');
        console.log('getTask direct attachments:', response.data.attachment_urls);
        finalData = response.data as Task;
      }
      
      // 添付ファイルの構造を検証
      if (finalData.attachment_urls) {
        console.log('添付ファイルあり、構造:', finalData.attachment_urls);
        console.log('添付ファイル type:', typeof finalData.attachment_urls);
        console.log('添付ファイル isArray:', Array.isArray(finalData.attachment_urls));
        
        if (Array.isArray(finalData.attachment_urls)) {
          console.log('添付ファイル数:', finalData.attachment_urls.length);
          finalData.attachment_urls.forEach((attachment, index) => {
            console.log(`添付ファイル[${index}]:`, attachment);
          });
        }
      } else {
        console.log('添付ファイルなし');
      }
      
      if (response.data.data) {
        return {
          success: true,
          data: finalData,
          message: response.message
        };
      } else {
        return { ...response, data: finalData };
      }
    }
    
    return { ...response, success: false };
  },

  /**
   * 新しいタスクを作成（添付ファイル対応）
   * @param taskData タスクデータ
   */
  async createTask(taskData: any): Promise<ApiResponse<Task>> {
    try {
      const formData = new FormData();
      
      // 通常のフィールドをFormDataに追加
      for (const key in taskData) {
        if (key === 'newAttachmentFiles') continue;
        
        if (Array.isArray(taskData[key])) {
          taskData[key].forEach((item: any, index: number) => {
            formData.append(`task[${key}][]`, item);
          });
        } else if (taskData[key] !== null && taskData[key] !== undefined) {
          formData.append(`task[${key}]`, taskData[key]);
        }
      }

      // 新しい添付ファイルを追加
      if (taskData.newAttachmentFiles && Array.isArray(taskData.newAttachmentFiles)) {
        console.log(`ファイル送信前チェック: ${taskData.newAttachmentFiles.length}個のファイル`, taskData.newAttachmentFiles);
        
        taskData.newAttachmentFiles.forEach((file: any, index: number) => {
          // ファイルの検証と詳細ログ
          console.log(`処理中のファイル[${index}]:`, file, 
            typeof file, 
            file instanceof File, 
            file && typeof file === 'object' ? `size:${file.size}` : 'no-size');
          
          // ファイルの検証
          if (file && typeof file === 'object' && file.size > 0) {
            try {
              // Content-Dispositionヘッダーがファイル名を保持するよう明示的に指定
              formData.append('task[attachments][]', file, file.name);
              console.log(`添付ファイル[${index}]をFormDataに追加:`, file.name, file.type, file.size);
            } catch (e) {
              console.error(`ファイル追加エラー:`, e);
            }
          }
        });
      }
      
      // デバッグ用: 送信するFormDataの内容をコンソールに表示
      console.log('FormData entries:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // POSTリクエストを送信
      const response = await api.post('/api/tasks', formData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        }
      });

      // APIレスポンスを適切な型に変換して返す
      if (response.data && typeof response.data === 'object') {
        return {
          success: true,
          message: 'タスクが作成されました',
          data: response.data as Task
        } as ApiResponse<Task>;
      }

      return response.data as ApiResponse<Task>;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  /**
   * タスクを更新（添付ファイル対応）
   * @param id タスクID
   * @param taskData 更新データ
   */
  async updateTask(id: string, taskData: any): Promise<ApiResponse<Task>> {
    try {
      const formData = new FormData();
      
      // 通常のフィールドをFormDataに追加
      for (const key in taskData) {
        if (key === 'attachments' || key === 'newAttachmentFiles') continue;
        
        if (Array.isArray(taskData[key])) {
          taskData[key].forEach((item: any, index: number) => {
            formData.append(`task[${key}][]`, item);
          });
        } else if (taskData[key] !== null && taskData[key] !== undefined) {
          formData.append(`task[${key}]`, taskData[key]);
        }
      }

      // 保持する添付ファイルのIDを追加
      if (taskData.attachments && Array.isArray(taskData.attachments)) {
        const retainedIds = taskData.attachments
          .filter((a: any) => a && a.id)
          .map((a: any) => a.id);
        
        retainedIds.forEach((id: string, index: number) => {
          formData.append(`task[retained_attachment_ids][]`, id);
        });
      }

      // 新しい添付ファイルを追加
      if (taskData.newAttachmentFiles && Array.isArray(taskData.newAttachmentFiles)) {
        console.log(`ファイル送信前チェック: ${taskData.newAttachmentFiles.length}個のファイル`, taskData.newAttachmentFiles);
        
        taskData.newAttachmentFiles.forEach((file: any, index: number) => {
          // ファイルの検証と詳細ログ
          console.log(`処理中のファイル[${index}]:`, file, 
            typeof file, 
            file instanceof File, 
            file && typeof file === 'object' ? `size:${file.size}` : 'no-size');
          
          // ファイルの検証
          if (file && typeof file === 'object' && file.size > 0) {
            try {
              // Content-Dispositionヘッダーがファイル名を保持するよう明示的に指定
              formData.append('task[attachments][]', file, file.name);
              console.log(`添付ファイル[${index}]をFormDataに追加:`, file.name, file.type, file.size);
            } catch (e) {
              console.error(`ファイル追加エラー:`, e);
            }
          }
        });
      }
      
      // デバッグ用: 送信するFormDataの内容をコンソールに表示
      console.log('FormData entries:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // PATCHリクエストを送信
      const response = await api.patch(`/api/tasks/${id}`, formData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        }
      });

      // APIレスポンスを適切な型に変換して返す
      if (response.data && typeof response.data === 'object') {
        return {
          success: true,
          message: 'タスクが更新されました',
          data: response.data as Task
        } as ApiResponse<Task>;
      }

      return response.data as ApiResponse<Task>;
    } catch (error) {
      console.error('Error updating task:', error);
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
    
    if (response.success && response.data && response.data.data) {
      return {
        success: true,
        data: response.data.data as Task[],
        message: response.message
      };
    } else if (response.success && response.data) {
       console.warn("Unexpected response structure in getMyTasks:", response.data);
       if (Array.isArray(response.data)) {
           return { ...response, data: response.data as Task[] };
       } else {
           return { ...response, success: false, message: response.message || "Failed to parse my tasks data" };
       }
    }
    
    return { ...response, success: false };
  },
  
  /**
   * タスクのステータスを更新
   * @param id タスクID
   * @param status 新しいステータス
   */
  async updateTaskStatus(id: string, status: 'pending' | 'in_progress' | 'completed'): Promise<ApiResponse<Task>> {
    const response = await api.put<any>(`/api/tasks/${id}/status`, { status });
    
    if (response.success && response.data && response.data.data) {
      return {
        success: true,
        data: response.data.data as Task,
        message: response.message
      };
    } else if (response.success && response.data) {
       console.warn("Unexpected response structure in updateTaskStatus:", response.data);
       return { ...response, data: response.data as Task };
    }
    
    return { ...response, success: false };
  },
  
  /**
   * タスクの担当者を変更
   * @param id タスクID
   * @param userId 新しい担当者のID
   */
  async assignTask(id: string, userId: string): Promise<ApiResponse<Task>> {
    const response = await api.put<any>(`/api/tasks/${id}/assign`, { user_id: userId });
    
    if (response.success && response.data && response.data.data) {
      return {
        success: true,
        data: response.data.data as Task,
        message: response.message
      };
    } else if (response.success && response.data) {
       console.warn("Unexpected response structure in assignTask:", response.data);
       return { ...response, data: response.data as Task };
    }
    
    return { ...response, success: false };
  },
  
  /**
   * ダッシュボード用のタスク統計情報を取得
   */
  async getTasksDashboard(): Promise<ApiResponse<any>> {
    const response = await api.get<any>('/api/tasks/dashboard');
    
    if (response.success && response.data && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.message
      };
    } else if (response.success && response.data) {
       console.warn("Unexpected response structure in getTasksDashboard:", response.data);
       return { ...response, data: response.data };
    }
    
    return { ...response, success: false };
  },
  
  /**
   * カレンダービュー用のタスクデータを取得
   */
  async getTasksCalendar(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const response = await api.get<any>('/api/tasks/calendar', {
      start_date: startDate,
      end_date: endDate
    });
    
    if (response.success && response.data && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.message
      };
    } else if (response.success && response.data) {
       console.warn("Unexpected response structure in getTasksCalendar:", response.data);
       return { ...response, data: response.data };
    }
    
    return { ...response, success: false };
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
    
    if (response.success && response.data && response.data.data) {
      return {
        success: true,
        data: response.data.data as {subtask: Task, parent_task: Task},
        message: response.message
      };
    } else if (response.success && response.data) {
       console.warn("Unexpected response structure in toggleSubtaskStatus:", response.data);
       // Assuming the structure might not be nested
       return { ...response, data: response.data as {subtask: Task, parent_task: Task} }; 
    }
    
    return { ...response, success: false };
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
