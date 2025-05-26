/**
 * チャット機能関連の型定義
 */

// ユーザー関連の型
export interface User {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  last_seen_at?: string;
  is_online?: boolean;
}

// メッセージ関連の型
export interface Message {
  id: string;
  content: string;
  user_id: string;
  chat_room_id: string;
  created_at: string;
  updated_at: string;
  read: boolean;
  read_at?: string;
  user: User;
  attachment_url?: string;
  is_edited?: boolean;
  edited_at?: string;
}

// チャットルーム関連の型
export interface ChatRoom {
  id: string;
  name: string;
  is_direct_message: boolean;
  created_at: string;
  updated_at: string;
  users: User[];
  last_message?: Message;
  unread_count?: number;
  online_users_count?: number;
  description?: string;
}

// チャットルームメンバーシップの型
export interface ChatRoomMembership {
  id: string;
  user_id: string;
  chat_room_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  user: User;
}

// API レスポンスの型（api.tsから継承）
import { ApiResponse as BaseApiResponse } from './api';

export interface ApiResponse<T = any> extends BaseApiResponse<T> {
  error_code?: string;
  timestamp?: string;
}

// ページネーション情報の型
export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

// メッセージ一覧のレスポンス型
export interface MessagesResponse {
  success: boolean;
  data: Message[];
  pagination: PaginationInfo;
}

// WebSocket メッセージの型
export type WebSocketMessageType = 
  | 'new_message'
  | 'message_updated'
  | 'message_deleted'
  | 'message_read'
  | 'typing'
  | 'user_status'
  | 'error';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  message?: Message;
  message_updated?: Message;
  message_deleted?: { id: string };
  message_id?: string;
  user: User;
  is_typing?: boolean;
  status?: 'joined' | 'left' | 'online' | 'offline';
  timestamp: string;
  error_code?: string;
  errors?: string[];
}

// タイピング状態の型
export interface TypingUser {
  user: User;
  timestamp: number;
}

// チャット状態の型
export interface ChatState {
  currentRoom: ChatRoom | null;
  messages: Message[];
  rooms: ChatRoom[];
  typingUsers: TypingUser[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
}

// メッセージ送信の型
export interface SendMessageData {
  content: string;
  attachment?: File;
  reply_to_id?: string;
}

// ファイルアップロードの型
export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

// チャット設定の型
export interface ChatSettings {
  notifications: boolean;
  sound: boolean;
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  showTimestamps: boolean;
  showAvatars: boolean;
  autoScroll: boolean;
}

// エラーの型
export interface ChatError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// オンライン状態の型
export interface OnlineStatus {
  [userId: string]: {
    isOnline: boolean;
    lastSeen: string;
  };
}

// 検索結果の型
export interface MessageSearchResult {
  message: Message;
  chat_room: ChatRoom;
  highlights: string[];
}

// 統計情報の型
export interface ChatStatistics {
  total_messages: number;
  total_members: number;
  created_at: string;
  last_activity: string;
  messages_today: number;
  active_users_today: number;
}

// イベントハンドラーの型
export type MessageEventHandler = (message: Message) => void;
export type ErrorEventHandler = (error: ChatError) => void;
export type TypingEventHandler = (user: User, isTyping: boolean) => void;
export type UserStatusEventHandler = (user: User, status: string) => void;
