import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, SendMessageData } from '../types/chat';

interface QueuedMessage {
  id: string;
  roomId: string;
  data: SendMessageData;
  timestamp: number;
  retryCount: number;
}

interface OfflineSupportConfig {
  maxRetries?: number;
  retryDelay?: number;
  storageKey?: string;
}

interface OfflineSupportResult {
  isOnline: boolean;
  queuedMessages: QueuedMessage[];
  addToQueue: (roomId: string, data: SendMessageData) => string;
  removeFromQueue: (messageId: string) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
  getQueueSize: () => number;
}

export const useOfflineSupport = (
  config: OfflineSupportConfig = {}
): OfflineSupportResult => {
  const {
    maxRetries = 3,
    retryDelay = 5000,
    storageKey = 'chat_offline_queue'
  } = config;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const processingRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ローカルストレージからキューを読み込み
  const loadQueueFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setQueuedMessages(parsed);
      }
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
    }
  }, [storageKey]);

  // ローカルストレージにキューを保存
  const saveQueueToStorage = useCallback((queue: QueuedMessage[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }, [storageKey]);

  // オンライン状態の監視
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // オンラインになったらキューを処理
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初期化時にキューを読み込み
    loadQueueFromStorage();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [loadQueueFromStorage]);

  // キューの変更時にストレージに保存
  useEffect(() => {
    saveQueueToStorage(queuedMessages);
  }, [queuedMessages, saveQueueToStorage]);

  // メッセージをキューに追加
  const addToQueue = useCallback((roomId: string, data: SendMessageData): string => {
    const messageId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedMessage: QueuedMessage = {
      id: messageId,
      roomId,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    setQueuedMessages(prev => [...prev, queuedMessage]);
    
    return messageId;
  }, []);

  // キューからメッセージを削除
  const removeFromQueue = useCallback((messageId: string) => {
    setQueuedMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // キューをクリア
  const clearQueue = useCallback(() => {
    setQueuedMessages([]);
  }, []);

  // キューのサイズを取得
  const getQueueSize = useCallback(() => {
    return queuedMessages.length;
  }, [queuedMessages.length]);

  // キューの処理
  const processQueue = useCallback(async () => {
    if (!isOnline || processingRef.current || queuedMessages.length === 0) {
      return;
    }

    processingRef.current = true;

    try {
      // 古い順にソート
      const sortedQueue = [...queuedMessages].sort((a, b) => a.timestamp - b.timestamp);
      
      for (const queuedMessage of sortedQueue) {
        try {
          // 実際のメッセージ送信処理（chatServiceを使用）
          // この部分は実際の送信ロジックに置き換える必要があります
          const response = await fetch(`/api/chat_rooms/${queuedMessage.roomId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              message: {
                content: queuedMessage.data.content
              }
            })
          });

          if (response.ok) {
            // 送信成功 - キューから削除
            removeFromQueue(queuedMessage.id);
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error('Failed to send queued message:', error);
          
          // リトライ回数を増やす
          const updatedMessage = {
            ...queuedMessage,
            retryCount: queuedMessage.retryCount + 1
          };

          if (updatedMessage.retryCount >= maxRetries) {
            // 最大リトライ回数に達した場合は削除
            removeFromQueue(queuedMessage.id);
            console.error('Message removed from queue after max retries:', queuedMessage);
          } else {
            // リトライ回数を更新
            setQueuedMessages(prev => 
              prev.map(msg => 
                msg.id === queuedMessage.id ? updatedMessage : msg
              )
            );
          }
        }
      }
    } finally {
      processingRef.current = false;
    }

    // まだキューにメッセージがある場合は再試行をスケジュール
    if (queuedMessages.length > 0 && isOnline) {
      retryTimeoutRef.current = setTimeout(() => {
        processQueue();
      }, retryDelay);
    }
  }, [isOnline, queuedMessages, maxRetries, retryDelay, removeFromQueue]);

  // オンライン状態が変わった時にキューを処理
  useEffect(() => {
    if (isOnline && queuedMessages.length > 0) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  return {
    isOnline,
    queuedMessages,
    addToQueue,
    removeFromQueue,
    processQueue,
    clearQueue,
    getQueueSize
  };
}; 
