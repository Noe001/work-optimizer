/**
 * チャット機能関連の型定義
 */

export interface ChatRoom {
  id: string;
  name: string;
  is_direct_message: boolean;
  created_at: string;
  updated_at: string;
  users?: User[];
}

export interface DirectMessage extends ChatRoom {
  is_direct_message: true;
}

export interface ChatMessage {
  id: string;
  content: string;
  chat_room_id: string;
  user_id: string;
  read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  attachment_url?: string;
  user?: User;
}

export interface ChatRoomMembership {
  id: string;
  chat_room_id: string;
  user_id: string;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

export interface CreateChatRoomRequest {
  chat_room: {
    name?: string;
    is_direct_message: boolean;
  };
  user_ids?: string[];
}

export interface SendMessageRequest {
  message: {
    content: string;
  };
  attachment?: File;
}

export interface ChatRoomsResponse {
  direct_messages: DirectMessage[];
  channels: ChatRoom[];
}

export interface MessagesResponse {
  messages: ChatMessage[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
  };
}

export interface ChatMessageEvent {
  message?: ChatMessage;
  message_updated?: ChatMessage;
  message_deleted?: { id: string };
  typing?: {
    user_id: string;
    user_name: string;
  };
}

import { User } from './api';
