import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Message, ChatRoom, User, TypingUser, WebSocketMessage } from '../types/chat';
import { chatService } from '../services/chatService';
import { errorHandler } from '../utils/errorHandler';

interface OptimizedChatConfig {
  roomId: string;
  pageSize?: number;
  enableVirtualization?: boolean;
  enableTypingIndicator?: boolean;
  typingTimeout?: number;
}

interface OptimizedChatResult {
  // データ
  messages: Message[];
  currentRoom: ChatRoom | null;
  typingUsers: TypingUser[];
  
  // 状態
  isLoading: boolean;
  isConnected: boolean;
  hasMoreMessages: boolean;
  error: string | null;
  
  // アクション
  sendMessage: (content: string, attachment?: File) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  markAsRead: (messageId: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  
  // 最適化されたデータ
  memoizedMessages: Message[];
  groupedMessages: Array<{
    date: string;
    messages: Message[];
  }>;
}

export const useOptimizedChat = (config: OptimizedChatConfig): OptimizedChatResult => {
  const {
    roomId,
    pageSize = 50,
    enableTypingIndicator = true,
    typingTimeout = 3000
  } = config;

  // 状態管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Refs
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const messagesMapRef = useRef<Map<string, Message>>(new Map());

  // メッセージのメモ化（重複排除とソート）
  const memoizedMessages = useMemo(() => {
    // Map を使用して重複を排除
    const messageMap = new Map<string, Message>();
    messages.forEach(message => {
      messageMap.set(message.id, message);
    });
    
    // 作成日時でソート
    return Array.from(messageMap.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messages]);

  // 日付でグループ化されたメッセージ
  const groupedMessages = useMemo(() => {
    const groups: Array<{ date: string; messages: Message[] }> = [];
    let currentDate = '';
    let currentGroup: Message[] = [];

    memoizedMessages.forEach(message => {
      const messageDate = new Date(message.created_at).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, [memoizedMessages]);

  // メッセージの追加（最適化）
  const addMessage = useCallback((newMessage: Message) => {
    setMessages(prevMessages => {
      // 既存のメッセージかチェック
      if (messagesMapRef.current.has(newMessage.id)) {
        return prevMessages;
      }
      
      messagesMapRef.current.set(newMessage.id, newMessage);
      return [...prevMessages, newMessage];
    });
  }, []);

  // メッセージの更新
  const updateMessage = useCallback((updatedMessage: Message) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      )
    );
    messagesMapRef.current.set(updatedMessage.id, updatedMessage);
  }, []);

  // メッセージの削除
  const removeMessage = useCallback((messageId: string) => {
    setMessages(prevMessages => 
      prevMessages.filter(msg => msg.id !== messageId)
    );
    messagesMapRef.current.delete(messageId);
  }, []);

  // WebSocketメッセージハンドラー
  const handleWebSocketMessage = useCallback((wsMessage: WebSocketMessage) => {
    switch (wsMessage.type) {
      case 'new_message':
        if (wsMessage.message) {
          addMessage(wsMessage.message);
        }
        break;
        
      case 'message_updated':
        if (wsMessage.message_updated) {
          updateMessage(wsMessage.message_updated);
        }
        break;
        
      case 'message_deleted':
        if (wsMessage.message_deleted) {
          removeMessage(wsMessage.message_deleted.id);
        }
        break;
        
      case 'typing':
        if (enableTypingIndicator && wsMessage.user && wsMessage.is_typing !== undefined) {
          setTypingUsers(prev => {
            const filtered = prev.filter(tu => tu.user.id !== wsMessage.user.id);
            if (wsMessage.is_typing) {
              return [...filtered, { user: wsMessage.user, timestamp: Date.now() }];
            }
            return filtered;
          });
        }
        break;
        
      case 'error':
        setError(wsMessage.message || 'WebSocketエラーが発生しました');
        break;
    }
  }, [addMessage, updateMessage, removeMessage, enableTypingIndicator]);

  // 初期データの読み込み
  const loadInitialData = useCallback(async () => {
    if (!roomId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // チャットルーム情報の取得
      const roomResponse = await chatService.getChatRoom(roomId);
      if (roomResponse.success && roomResponse.data) {
        setCurrentRoom(roomResponse.data);
      }
      
      // 初期メッセージの取得
      const messagesResponse = await chatService.getMessages(roomId, 1, pageSize);
      if (messagesResponse.success && messagesResponse.data) {
        setMessages(messagesResponse.data);
        messagesResponse.data.forEach(message => {
          messagesMapRef.current.set(message.id, message);
        });
        
        setHasMoreMessages(
          messagesResponse.pagination ? 
          messagesResponse.pagination.current_page < messagesResponse.pagination.total_pages :
          false
        );
      }
      
      // WebSocket接続
      await chatService.connectToRoom(roomId, handleWebSocketMessage);
      setIsConnected(true);
      
    } catch (error) {
      const chatError = errorHandler.handleError(error, 'loadInitialData');
      setError(chatError.message);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, pageSize, handleWebSocketMessage]);

  // 追加メッセージの読み込み
  const loadMoreMessages = useCallback(async () => {
    if (!roomId || !hasMoreMessages || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const nextPage = currentPage + 1;
      const response = await chatService.getMessages(roomId, nextPage, pageSize);
      
      if (response.success && response.data) {
        const newMessages = response.data.filter(
          msg => !messagesMapRef.current.has(msg.id)
        );
        
        setMessages(prev => [...newMessages, ...prev]);
        newMessages.forEach(message => {
          messagesMapRef.current.set(message.id, message);
        });
        
        setCurrentPage(nextPage);
        setHasMoreMessages(
          response.pagination ? 
          response.pagination.current_page < response.pagination.total_pages :
          false
        );
      }
    } catch (error) {
      const chatError = errorHandler.handleError(error, 'loadMoreMessages');
      setError(chatError.message);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, hasMoreMessages, isLoading, currentPage, pageSize]);

  // メッセージ送信
  const sendMessage = useCallback(async (content: string, attachment?: File) => {
    if (!roomId || !content.trim()) return;
    
    try {
      await chatService.sendMessage(roomId, { content, attachment });
      
      // タイピング状態をクリア
      if (isTypingRef.current) {
        stopTyping();
      }
    } catch (error) {
      const chatError = errorHandler.handleError(error, 'sendMessage');
      setError(chatError.message);
      throw error;
    }
  }, [roomId]);

  // 既読マーク
  const markAsRead = useCallback((messageId: string) => {
    if (!roomId) return;
    
    try {
      chatService.markAsRead(roomId, messageId);
    } catch (error) {
      errorHandler.handleError(error, 'markAsRead');
    }
  }, [roomId]);

  // タイピング開始
  const startTyping = useCallback(() => {
    if (!enableTypingIndicator || !roomId || isTypingRef.current) return;
    
    isTypingRef.current = true;
    chatService.sendTyping(roomId, true);
    
    // タイムアウトの設定
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, typingTimeout);
  }, [enableTypingIndicator, roomId, typingTimeout]);

  // タイピング停止
  const stopTyping = useCallback(() => {
    if (!enableTypingIndicator || !roomId || !isTypingRef.current) return;
    
    isTypingRef.current = false;
    chatService.sendTyping(roomId, false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [enableTypingIndicator, roomId]);

  // タイピングユーザーのクリーンアップ
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => 
        prev.filter(tu => now - tu.timestamp < typingTimeout)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [typingTimeout]);

  // 初期化
  useEffect(() => {
    loadInitialData();
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      chatService.disconnect();
      setIsConnected(false);
    };
  }, [loadInitialData]);

  // roomId変更時のクリーンアップ
  useEffect(() => {
    setMessages([]);
    setCurrentRoom(null);
    setTypingUsers([]);
    setError(null);
    setCurrentPage(1);
    setHasMoreMessages(true);
    messagesMapRef.current.clear();
  }, [roomId]);

  return {
    // データ
    messages: memoizedMessages,
    currentRoom,
    typingUsers,
    
    // 状態
    isLoading,
    isConnected,
    hasMoreMessages,
    error,
    
    // アクション
    sendMessage,
    loadMoreMessages,
    markAsRead,
    startTyping,
    stopTyping,
    
    // 最適化されたデータ
    memoizedMessages,
    groupedMessages,
  };
}; 
