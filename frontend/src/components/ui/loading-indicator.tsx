import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  className?: string;
}

/**
 * ローディングインジケーターコンポーネント
 */
export function LoadingIndicator({ 
  text = 'ロード中...',
  size = 'md', 
  fullPage = false,
  className = ''
}: LoadingIndicatorProps) {
  // サイズに応じたアイコンサイズを設定
  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }[size];
  
  // テキストのサイズを設定
  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size];
  
  // フルページ表示の場合のラッパー
  if (fullPage) {
    return (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-background p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-center">
            <Loader2 className={`${iconSize} animate-spin text-primary mr-2`} />
            <p className={textSize}>{text}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // 通常表示
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Loader2 className={`${iconSize} animate-spin text-primary mr-2`} />
      <p className={textSize}>{text}</p>
    </div>
  );
}

export default LoadingIndicator; 
