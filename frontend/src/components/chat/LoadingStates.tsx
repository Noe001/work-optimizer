import React from 'react';

// メッセージローディングスケルトン
export const MessageSkeleton: React.FC = () => {
  return (
    <div className="flex items-start space-x-3 p-4 animate-pulse">
      {/* アバタースケルトン */}
      <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
      
      {/* メッセージ内容スケルトン */}
      <div className="flex-1 space-y-2">
        {/* ユーザー名 */}
        <div className="h-4 bg-gray-300 rounded w-24"></div>
        
        {/* メッセージ内容 */}
        <div className="space-y-1">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
        
        {/* タイムスタンプ */}
        <div className="h-3 bg-gray-300 rounded w-16"></div>
      </div>
    </div>
  );
};

// メッセージリストローディング
export const MessageListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <MessageSkeleton key={index} />
      ))}
    </div>
  );
};

// チャットルームリストスケルトン
export const ChatRoomSkeleton: React.FC = () => {
  return (
    <div className="flex items-center space-x-3 p-3 animate-pulse">
      {/* アバタースケルトン */}
      <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
      
      {/* チャットルーム情報 */}
      <div className="flex-1 space-y-2">
        {/* ルーム名 */}
        <div className="h-4 bg-gray-300 rounded w-32"></div>
        
        {/* 最新メッセージ */}
        <div className="h-3 bg-gray-300 rounded w-48"></div>
      </div>
      
      {/* 時間と未読数 */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 rounded w-12"></div>
        <div className="w-5 h-5 bg-gray-300 rounded-full ml-auto"></div>
      </div>
    </div>
  );
};

// チャットルームリストローディング
export const ChatRoomListSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <ChatRoomSkeleton key={index} />
      ))}
    </div>
  );
};

// タイピングインジケーター
export const TypingIndicator: React.FC<{ userNames: string[] }> = ({ userNames }) => {
  if (userNames.length === 0) return null;

  const displayText = userNames.length === 1 
    ? `${userNames[0]}が入力中...`
    : userNames.length === 2
    ? `${userNames[0]}と${userNames[1]}が入力中...`
    : `${userNames[0]}他${userNames.length - 1}人が入力中...`;

  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-500">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span>{displayText}</span>
    </div>
  );
};

// 接続状態インジケーター
export const ConnectionStatus: React.FC<{ 
  isConnected: boolean;
  isReconnecting?: boolean;
}> = ({ isConnected, isReconnecting = false }) => {
  if (isConnected && !isReconnecting) return null;

  return (
    <div className={`
      fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2
      ${isReconnecting ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'}
    `}>
      {isReconnecting ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>再接続中...</span>
        </>
      ) : (
        <>
          <div className="w-3 h-3 bg-white rounded-full"></div>
          <span>接続が切断されました</span>
        </>
      )}
    </div>
  );
};

// メッセージ送信中インジケーター
export const SendingIndicator: React.FC = () => {
  return (
    <div className="flex items-center justify-end space-x-2 px-4 py-2">
      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm text-gray-500">送信中...</span>
    </div>
  );
};

// ファイルアップロード進捗
export const FileUploadProgress: React.FC<{ 
  fileName: string;
  progress: number;
  onCancel?: () => void;
}> = ({ fileName, progress, onCancel }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mx-4 mb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-900 truncate">{fileName}</span>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            キャンセル
          </button>
        )}
      </div>
      
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="text-xs text-blue-700 mt-1">
        {progress}% 完了
      </div>
    </div>
  );
};

// エラー表示
export const ErrorMessage: React.FC<{ 
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ message, onRetry, onDismiss }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800">{message}</p>
          
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex space-x-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                >
                  再試行
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-red-600 px-3 py-1 rounded text-sm hover:text-red-800 transition-colors"
                >
                  閉じる
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 空の状態
export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm">{description}</p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}; 
