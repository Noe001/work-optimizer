import { Button } from './button';
import { AlertCircle } from 'lucide-react';

interface ApiErrorProps {
  error: string | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * API通信のエラーを表示するコンポーネント
 */
export function ApiError({ error, onRetry, className = '' }: ApiErrorProps) {
  if (!error) return null;

  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium mb-1">エラーが発生しました</p>
          <p className="text-sm">{error}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              className="mt-2 bg-background" 
              onClick={onRetry}
              size="sm"
            >
              再試行
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApiError; 
