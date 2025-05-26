import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Message } from '../types/chat';

interface VirtualizedMessagesConfig {
  containerHeight: number;
  itemHeight: number;
  overscan?: number;
  threshold?: number;
}

interface VirtualizedMessagesResult {
  visibleItems: Array<{
    index: number;
    message: Message;
    style: React.CSSProperties;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  scrollToBottom: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
}

export const useVirtualizedMessages = (
  messages: Message[],
  config: VirtualizedMessagesConfig
): VirtualizedMessagesResult => {
  const {
    containerHeight,
    itemHeight,
    overscan = 5,
    threshold = 100
  } = config;

  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(messages.length);

  // 表示範囲の計算
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      messages.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, overscan, messages.length]);

  // 表示するアイテムの計算
  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (messages[i]) {
        items.push({
          index: i,
          message: messages[i],
          style: {
            position: 'absolute' as const,
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          },
        });
      }
    }
    return items;
  }, [visibleRange, messages, itemHeight]);

  // 総高さの計算
  const totalHeight = useMemo(() => {
    return messages.length * itemHeight;
  }, [messages.length, itemHeight]);

  // スクロールハンドラー
  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const newScrollTop = target.scrollTop;
    setScrollTop(newScrollTop);

    // 最下部にいるかどうかの判定
    const isAtBottom = newScrollTop + containerHeight >= totalHeight - threshold;
    setIsScrolledToBottom(isAtBottom);
  }, [containerHeight, totalHeight, threshold]);

  // 特定のインデックスにスクロール
  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      const scrollTop = index * itemHeight;
      containerRef.current.scrollTop = scrollTop;
      setScrollTop(scrollTop);
    }
  }, [itemHeight]);

  // 最下部にスクロール
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      const scrollTop = totalHeight - containerHeight;
      containerRef.current.scrollTop = Math.max(0, scrollTop);
      setScrollTop(Math.max(0, scrollTop));
      setIsScrolledToBottom(true);
    }
  }, [totalHeight, containerHeight]);

  // 新しいメッセージが追加された時の自動スクロール
  useEffect(() => {
    const messageCountChanged = messages.length !== lastMessageCountRef.current;
    const newMessagesAdded = messages.length > lastMessageCountRef.current;
    
    if (messageCountChanged) {
      lastMessageCountRef.current = messages.length;
      
      // 最下部にいる場合は自動的に最下部にスクロール
      if (newMessagesAdded && isScrolledToBottom) {
        // 少し遅延させてDOMの更新を待つ
        setTimeout(() => {
          scrollToBottom();
        }, 0);
      }
    }
  }, [messages.length, isScrolledToBottom, scrollToBottom]);

  return {
    visibleItems,
    totalHeight,
    scrollToIndex,
    scrollToBottom,
    containerRef,
    onScroll,
  };
}; 
