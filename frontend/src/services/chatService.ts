import { api } from './api';
import { ApiResponse } from '../types/api';
import { 
  ChatRoom, 
  ChatMessage, 
  ChatRoomsResponse, 
  CreateChatRoomRequest,
  SendMessageRequest,
  MessagesResponse
} from '../types/chat';
import type { Subscription, Consumer } from '@rails/actioncable';

/**
 * チャットサービス
 */
const chatService = {
  /**
   * チャットルーム一覧の取得
   */
  async getChatRooms(): Promise<ApiResponse<ChatRoomsResponse>> {
    return api.get<ChatRoomsResponse>('/api/chat_rooms');
  },

  /**
   * 特定のチャットルーム詳細を取得
   * @param chatRoomId チャットルームID
   */
  async getChatRoom(chatRoomId: string): Promise<ApiResponse<ChatRoom>> {
    return api.get<ChatRoom>(`/api/chat_rooms/${chatRoomId}`);
  },

  /**
   * チャットルームの作成
   * @param data チャットルーム作成データ
   */
  async createChatRoom(data: CreateChatRoomRequest): Promise<ApiResponse<ChatRoom>> {
    return api.post<ChatRoom>('/api/chat_rooms', data);
  },

  /**
   * チャットルームの更新
   * @param chatRoomId チャットルームID
   * @param name 新しいチャットルーム名
   */
  async updateChatRoom(chatRoomId: string, name: string): Promise<ApiResponse<ChatRoom>> {
    return api.put<ChatRoom>(`/api/chat_rooms/${chatRoomId}`, {
      chat_room: { name }
    });
  },

  /**
   * チャットルームの削除
   * @param chatRoomId チャットルームID
   */
  async deleteChatRoom(chatRoomId: string): Promise<ApiResponse<any>> {
    return api.delete<any>(`/api/chat_rooms/${chatRoomId}`);
  },

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
  ): Promise<ApiResponse<MessagesResponse>> {
    return api.get<MessagesResponse>(
      `/api/chat_rooms/${chatRoomId}/messages`,
      { page, per_page: perPage }
    );
  },

  /**
   * メッセージの送信
   * @param chatRoomId チャットルームID
   * @param content メッセージ内容
   * @param attachment 添付ファイル（オプション）
   */
  async sendMessage(
    chatRoomId: string, 
    content: string, 
    attachment?: File
  ): Promise<ApiResponse<ChatMessage>> {
    const formData = new FormData();
    formData.append('message[content]', content);
    
    if (attachment) {
      formData.append('attachment', attachment);
    }
    
    return api.post<ChatMessage>(
      `/api/chat_rooms/${chatRoomId}/messages`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  },

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
  ): Promise<ApiResponse<ChatMessage>> {
    return api.put<ChatMessage>(
      `/api/chat_rooms/${chatRoomId}/messages/${messageId}`, 
      {
        message: { content }
      }
    );
  },

  /**
   * メッセージの削除
   * @param chatRoomId チャットルームID
   * @param messageId メッセージID
   */
  async deleteMessage(
    chatRoomId: string, 
    messageId: string
  ): Promise<ApiResponse<any>> {
    return api.delete<any>(`/api/chat_rooms/${chatRoomId}/messages/${messageId}`);
  },

  /**
   * すべてのメッセージを既読にする
   * @param chatRoomId チャットルームID
   */
  async readAllMessages(chatRoomId: string): Promise<ApiResponse<any>> {
    return api.post<any>(`/api/chat_rooms/${chatRoomId}/messages/read_all`);
  },

  /**
   * チャットルームにメンバーを追加
   * @param chatRoomId チャットルームID
   * @param userId ユーザーID
   * @param role ロール（デフォルトは'member'）
   */
  async addMember(
    chatRoomId: string, 
    userId: string, 
    role: 'admin' | 'member' = 'member'
  ): Promise<ApiResponse<any>> {
    return api.post<any>(`/api/chat_rooms/${chatRoomId}/add_member`, {
      user_id: userId,
      role
    });
  },

  /**
   * チャットルームからメンバーを削除
   * @param chatRoomId チャットルームID
   * @param userId ユーザーID
   */
  async removeMember(chatRoomId: string, userId: string): Promise<ApiResponse<any>> {
    return api.delete<any>(`/api/chat_rooms/${chatRoomId}/remove_member/${userId}`);
  },

  /**
   * Action Cable接続の作成
   * @returns Promise<Consumer> Action Cableコンシューマーを返すPromise
   */
  async createCableConnection() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const token = localStorage.getItem('auth_token');
    
    const cableUrl = `${baseUrl}/cable?token=${token}`;
    
    try {
      const ActionCable = await import('@rails/actioncable');
      return ActionCable.createConsumer(cableUrl);
    } catch (error) {
      console.error('Failed to load ActionCable:', error);
      throw error;
    }
  },

  /**
   * チャットルームのサブスクライブ
   * @param chatRoomId チャットルームID
   * @param callbacks コールバック関数
   */
  async subscribeToChatRoom(
    chatRoomId: string, 
    callbacks: {
      onReceived: (data: any) => void;
      onConnected?: () => void;
      onDisconnected?: () => void;
    }
  ): Promise<any> {
    try {
      const consumer = await this.createCableConnection();
      
      return consumer.subscriptions.create(
        {
          channel: 'ChatChannel',
          chat_room_id: chatRoomId
        },
        {
          connected() {
            console.log(`Connected to chat room: ${chatRoomId}`);
            if (callbacks.onConnected) {
              callbacks.onConnected();
            }
          },
          
          disconnected() {
            console.log(`Disconnected from chat room: ${chatRoomId}`);
            if (callbacks.onDisconnected) {
              callbacks.onDisconnected();
            }
          },
          
          received(data: any) {
            callbacks.onReceived(data);
          },
          
          typing() {
            this.perform('typing');
          }
        }
      );
    } catch (error) {
      console.error('Failed to subscribe to chat room:', error);
      throw error;
    }
  }
};

export { chatService };
