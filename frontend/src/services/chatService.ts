import { api } from './api';
import { 
  ChatRoom, 
  Message, 
  ApiResponse,
  MessagesResponse,
  SendMessageData,
  WebSocketMessage
} from '../types/chat';
import { errorHandler } from '../utils/errorHandler';
import type { Subscription, Consumer } from '@rails/actioncable';

/**
 * チャットサービス
 */
class ChatService {
  private consumer: Consumer | null = null;
  private subscriptions: Map<string, Subscription> = new Map();

  /**
   * チャットルーム一覧の取得
   */
  async getChatRooms(): Promise<ApiResponse<ChatRoom[]>> {
    try {
      return await api.get<ChatRoom[]>('/api/chat_rooms');
    } catch (error) {
      throw errorHandler.handleError(error, 'getChatRooms');
    }
  }

  /**
   * 特定のチャットルーム詳細を取得
   * @param chatRoomId チャットルームID
   */
  async getChatRoom(chatRoomId: string): Promise<ApiResponse<ChatRoom>> {
    try {
      return await api.get<ChatRoom>(`/api/chat_rooms/${chatRoomId}`);
    } catch (error) {
      throw errorHandler.handleError(error, 'getChatRoom');
    }
  }

  /**
   * チャットルームの作成
   * @param name チャットルーム名
   * @param isDirectMessage ダイレクトメッセージかどうか
   * @param userIds 参加ユーザーID（オプション）
   */
  async createChatRoom(
    name: string, 
    isDirectMessage: boolean = false, 
    userIds?: string[]
  ): Promise<ApiResponse<ChatRoom>> {
    try {
      const data = {
        chat_room: {
          name,
          is_direct_message: isDirectMessage
        },
        user_ids: userIds
      };
      return await api.post<ChatRoom>('/api/chat_rooms', data);
    } catch (error) {
      throw errorHandler.handleError(error, 'createChatRoom');
    }
  }

  /**
   * チャットルームの更新
   * @param chatRoomId チャットルームID
   * @param name 新しいチャットルーム名
   */
  async updateChatRoom(chatRoomId: string, name: string): Promise<ApiResponse<ChatRoom>> {
    try {
      return await api.put<ChatRoom>(`/api/chat_rooms/${chatRoomId}`, {
        chat_room: { name }
      });
    } catch (error) {
      throw errorHandler.handleError(error, 'updateChatRoom');
    }
  }

  /**
   * チャットルームの削除
   * @param chatRoomId チャットルームID
   */
  async deleteChatRoom(chatRoomId: string): Promise<ApiResponse<any>> {
    try {
      return await api.delete<any>(`/api/chat_rooms/${chatRoomId}`);
    } catch (error) {
      throw errorHandler.handleError(error, 'deleteChatRoom');
    }
  }

  /**
   * メッセージ履歴の取得
   * @param chatRoomId チャットルームID
   * @param page ページ番号
   * @param perPage 1ページあたりのメッセージ数
   */
  async getMessages(
    chatRoomId: string, 
    page: number = 1, 
    perPage: number = 20
  ): Promise<MessagesResponse> {
    try {
      const response = await api.get<Message[]>(
        `/api/chat_rooms/${chatRoomId}/messages`,
        { page, per_page: perPage }
      );
      
      // レスポンス形式を統一
      return {
        success: response.success,
        data: response.data || [],
        pagination: {
          current_page: page,
          total_pages: Math.ceil((response.data?.length || 0) / perPage),
          total_count: response.data?.length || 0,
          per_page: perPage
        }
      };
    } catch (error) {
      throw errorHandler.handleError(error, 'getMessages');
    }
  }

  /**
   * メッセージの送信
   * @param chatRoomId チャットルームID
   * @param data メッセージデータ
   */
  async sendMessage(
    chatRoomId: string, 
    data: SendMessageData
  ): Promise<ApiResponse<Message>> {
    try {
      const formData = new FormData();
      formData.append('message[content]', data.content);
      
      if (data.attachment) {
        formData.append('attachment', data.attachment);
      }
      
      if (data.reply_to_id) {
        formData.append('message[reply_to_id]', data.reply_to_id);
      }
      
      return await api.post<Message>(
        `/api/chat_rooms/${chatRoomId}/messages`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
    } catch (error) {
      throw errorHandler.handleError(error, 'sendMessage');
    }
  }

  /**
   * メッセージの更新
   * @param chatRoomId チャットルームID
   * @param messageId メッセージID
   * @param content 新しいメッセージ内容
   */
  async updateMessage(
    chatRoomId: string, 
    messageId: string, 
    content: string
  ): Promise<ApiResponse<Message>> {
    try {
      return await api.put<Message>(
        `/api/chat_rooms/${chatRoomId}/messages/${messageId}`, 
        {
          message: { content }
        }
      );
    } catch (error) {
      throw errorHandler.handleError(error, 'updateMessage');
    }
  }

  /**
   * メッセージの削除
   * @param chatRoomId チャットルームID
   * @param messageId メッセージID
   */
  async deleteMessage(
    chatRoomId: string, 
    messageId: string
  ): Promise<ApiResponse<any>> {
    try {
      return await api.delete<any>(`/api/chat_rooms/${chatRoomId}/messages/${messageId}`);
    } catch (error) {
      throw errorHandler.handleError(error, 'deleteMessage');
    }
  }

  /**
   * メッセージを既読にする
   * @param chatRoomId チャットルームID
   * @param messageId メッセージID
   */
  async markAsRead(chatRoomId: string, messageId: string): Promise<ApiResponse<any>> {
    try {
      return await api.post<any>(`/api/chat_rooms/${chatRoomId}/messages/${messageId}/read`);
    } catch (error) {
      throw errorHandler.handleError(error, 'markAsRead');
    }
  }

  /**
   * すべてのメッセージを既読にする
   * @param chatRoomId チャットルームID
   */
  async readAllMessages(chatRoomId: string): Promise<ApiResponse<any>> {
    try {
      return await api.post<any>(`/api/chat_rooms/${chatRoomId}/messages/read_all`);
    } catch (error) {
      throw errorHandler.handleError(error, 'readAllMessages');
    }
  }

  /**
   * タイピング状態の送信
   * @param chatRoomId チャットルームID
   * @param isTyping タイピング中かどうか
   */
  async sendTyping(chatRoomId: string, isTyping: boolean): Promise<void> {
    try {
      const subscription = this.subscriptions.get(chatRoomId);
      if (subscription) {
        subscription.perform('typing', { is_typing: isTyping });
      }
    } catch (error) {
      errorHandler.handleError(error, 'sendTyping');
    }
  }

  /**
   * チャットルームにメンバーを追加
   * @param chatRoomId チャットルームID
   * @param userId ユーザーID
   * @param role ロール（デフォルトは'member'）
   */
  async addMember(
    chatRoomId: string, 
    userId: string, 
    role: 'admin' | 'moderator' | 'member' = 'member'
  ): Promise<ApiResponse<any>> {
    try {
      return await api.post<any>(`/api/chat_rooms/${chatRoomId}/add_member`, {
        user_id: userId,
        role
      });
    } catch (error) {
      throw errorHandler.handleError(error, 'addMember');
    }
  }

  /**
   * チャットルームからメンバーを削除
   * @param chatRoomId チャットルームID
   * @param userId ユーザーID
   */
  async removeMember(chatRoomId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      return await api.delete<any>(`/api/chat_rooms/${chatRoomId}/remove_member/${userId}`);
    } catch (error) {
      throw errorHandler.handleError(error, 'removeMember');
    }
  }

  /**
   * Action Cable接続の作成
   */
  async createCableConnection(): Promise<Consumer> {
    try {
      if (this.consumer) {
        return this.consumer;
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('認証トークンが見つかりません');
      }
      
      const cableUrl = `${baseUrl}/cable?token=${token}`;
      
      const ActionCable = await import('@rails/actioncable');
      this.consumer = ActionCable.createConsumer(cableUrl);
      
      return this.consumer;
    } catch (error) {
      throw errorHandler.handleError(error, 'createCableConnection');
    }
  }

  /**
   * チャットルームに接続
   * @param chatRoomId チャットルームID
   * @param onMessage メッセージ受信時のコールバック
   */
  async connectToRoom(
    chatRoomId: string, 
    onMessage: (message: WebSocketMessage) => void
  ): Promise<Subscription> {
    try {
      const consumer = await this.createCableConnection();
      
      // 既存の接続があれば切断
      const existingSubscription = this.subscriptions.get(chatRoomId);
      if (existingSubscription) {
        existingSubscription.unsubscribe();
      }

      const subscription = consumer.subscriptions.create(
        { channel: 'ChatChannel', chat_room_id: chatRoomId },
        {
          connected: () => {
            console.log(`Connected to chat room: ${chatRoomId}`);
          },
          
          disconnected: () => {
            console.log(`Disconnected from chat room: ${chatRoomId}`);
            this.subscriptions.delete(chatRoomId);
          },
          
          received: (data: WebSocketMessage) => {
            try {
              onMessage(data);
            } catch (error) {
              errorHandler.handleError(error, 'WebSocket message handling');
            }
          }
        }
      );

      this.subscriptions.set(chatRoomId, subscription);
      return subscription;
    } catch (error) {
      throw errorHandler.handleError(error, 'connectToRoom');
    }
  }

  /**
   * チャットルームから切断
   * @param chatRoomId チャットルームID
   */
  disconnectFromRoom(chatRoomId: string): void {
    try {
      const subscription = this.subscriptions.get(chatRoomId);
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete(chatRoomId);
      }
    } catch (error) {
      errorHandler.handleError(error, 'disconnectFromRoom');
    }
  }

  /**
   * すべての接続を切断
   */
  disconnect(): void {
    try {
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      
      if (this.consumer) {
        this.consumer.disconnect();
        this.consumer = null;
      }
    } catch (error) {
      errorHandler.handleError(error, 'disconnect');
    }
  }

  /**
   * 接続状態の確認
   */
  isConnected(): boolean {
    return this.consumer !== null;
  }

  /**
   * 特定のルームに接続されているかの確認
   */
  isConnectedToRoom(chatRoomId: string): boolean {
    return this.subscriptions.has(chatRoomId);
  }
}

// シングルトンインスタンスをエクスポート
export const chatService = new ChatService();
