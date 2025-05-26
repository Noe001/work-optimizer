import { ChatError } from '../types/chat';

// エラーコードの定数
export const ERROR_CODES = {
  // ネットワークエラー
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  TIMEOUT: 'TIMEOUT',
  
  // 認証エラー
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // チャットエラー
  CHAT_ROOM_NOT_FOUND: 'CHAT_ROOM_NOT_FOUND',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  ACCESS_DENIED: 'ACCESS_DENIED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // バリデーションエラー
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  
  // サーバーエラー
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // WebSocketエラー
  WEBSOCKET_CONNECTION_FAILED: 'WEBSOCKET_CONNECTION_FAILED',
  WEBSOCKET_DISCONNECTED: 'WEBSOCKET_DISCONNECTED',
  
  // 一般的なエラー
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// エラーメッセージのマッピング
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.NETWORK_ERROR]: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
  [ERROR_CODES.CONNECTION_FAILED]: 'サーバーに接続できませんでした。しばらく時間をおいて再試行してください。',
  [ERROR_CODES.TIMEOUT]: 'リクエストがタイムアウトしました。再試行してください。',
  
  [ERROR_CODES.UNAUTHORIZED]: 'ログインが必要です。再度ログインしてください。',
  [ERROR_CODES.TOKEN_EXPIRED]: 'セッションが期限切れです。再度ログインしてください。',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'ユーザー名またはパスワードが正しくありません。',
  
  [ERROR_CODES.CHAT_ROOM_NOT_FOUND]: 'チャットルームが見つかりません。',
  [ERROR_CODES.MESSAGE_NOT_FOUND]: 'メッセージが見つかりません。',
  [ERROR_CODES.ACCESS_DENIED]: 'このチャットルームにアクセスする権限がありません。',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'メッセージ送信が制限されています。しばらくお待ちください。',
  
  [ERROR_CODES.VALIDATION_ERROR]: '入力内容に問題があります。確認してください。',
  [ERROR_CODES.FILE_TOO_LARGE]: 'ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。',
  [ERROR_CODES.INVALID_FILE_TYPE]: '許可されていないファイル形式です。',
  
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'サーバー内部エラーが発生しました。管理者にお問い合わせください。',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'サービスが一時的に利用できません。しばらく時間をおいて再試行してください。',
  
  [ERROR_CODES.WEBSOCKET_CONNECTION_FAILED]: 'リアルタイム通信の接続に失敗しました。',
  [ERROR_CODES.WEBSOCKET_DISCONNECTED]: 'リアルタイム通信が切断されました。再接続を試行しています。',
  
  [ERROR_CODES.UNKNOWN_ERROR]: '予期しないエラーが発生しました。'
};

// エラーの重要度レベル
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// エラーの重要度マッピング
const ERROR_SEVERITY: Record<string, ErrorSeverity> = {
  [ERROR_CODES.NETWORK_ERROR]: ErrorSeverity.MEDIUM,
  [ERROR_CODES.CONNECTION_FAILED]: ErrorSeverity.HIGH,
  [ERROR_CODES.TIMEOUT]: ErrorSeverity.LOW,
  
  [ERROR_CODES.UNAUTHORIZED]: ErrorSeverity.HIGH,
  [ERROR_CODES.TOKEN_EXPIRED]: ErrorSeverity.HIGH,
  [ERROR_CODES.INVALID_CREDENTIALS]: ErrorSeverity.MEDIUM,
  
  [ERROR_CODES.CHAT_ROOM_NOT_FOUND]: ErrorSeverity.MEDIUM,
  [ERROR_CODES.MESSAGE_NOT_FOUND]: ErrorSeverity.LOW,
  [ERROR_CODES.ACCESS_DENIED]: ErrorSeverity.MEDIUM,
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: ErrorSeverity.LOW,
  
  [ERROR_CODES.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [ERROR_CODES.FILE_TOO_LARGE]: ErrorSeverity.LOW,
  [ERROR_CODES.INVALID_FILE_TYPE]: ErrorSeverity.LOW,
  
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: ErrorSeverity.CRITICAL,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: ErrorSeverity.HIGH,
  
  [ERROR_CODES.WEBSOCKET_CONNECTION_FAILED]: ErrorSeverity.MEDIUM,
  [ERROR_CODES.WEBSOCKET_DISCONNECTED]: ErrorSeverity.MEDIUM,
  
  [ERROR_CODES.UNKNOWN_ERROR]: ErrorSeverity.MEDIUM
};

// エラーハンドラークラス
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: ((error: ChatError) => void)[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // エラーリスナーの追加
  addErrorListener(listener: (error: ChatError) => void): void {
    this.errorListeners.push(listener);
  }

  // エラーリスナーの削除
  removeErrorListener(listener: (error: ChatError) => void): void {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }

  // エラーの処理
  handleError(error: any, context?: string): ChatError {
    const chatError = this.normalizeError(error, context);
    
    // ログ出力
    this.logError(chatError);
    
    // リスナーに通知
    this.errorListeners.forEach(listener => {
      try {
        listener(chatError);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });

    return chatError;
  }

  // エラーの正規化
  private normalizeError(error: any, context?: string): ChatError {
    let code = ERROR_CODES.UNKNOWN_ERROR;
    let message = ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
    let details = null;

    if (error?.response) {
      // Axiosエラー
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        code = ERROR_CODES.UNAUTHORIZED;
      } else if (status === 403) {
        code = ERROR_CODES.ACCESS_DENIED;
      } else if (status === 404) {
        code = ERROR_CODES.CHAT_ROOM_NOT_FOUND;
      } else if (status === 422) {
        code = ERROR_CODES.VALIDATION_ERROR;
      } else if (status === 429) {
        code = ERROR_CODES.RATE_LIMIT_EXCEEDED;
      } else if (status >= 500) {
        code = ERROR_CODES.INTERNAL_SERVER_ERROR;
      }

      if (data?.error_code) {
        code = data.error_code;
      }

      if (data?.message) {
        message = data.message;
      } else {
        message = ERROR_MESSAGES[code] || message;
      }

      details = {
        status,
        statusText: error.response.statusText,
        data: data
      };
    } else if (error?.code) {
      // ネットワークエラー
      if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
        code = ERROR_CODES.NETWORK_ERROR;
      } else if (error.code === 'ECONNABORTED') {
        code = ERROR_CODES.TIMEOUT;
      }
      message = ERROR_MESSAGES[code];
      details = { originalCode: error.code };
    } else if (typeof error === 'string') {
      // 文字列エラー
      message = error;
      details = { originalMessage: error };
    } else if (error?.message) {
      // 一般的なErrorオブジェクト
      message = error.message;
      details = { stack: error.stack };
    }

    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    };
  }

  // エラーのログ出力
  private logError(error: ChatError): void {
    const severity = ERROR_SEVERITY[error.code] || ErrorSeverity.MEDIUM;
    
    const logData = {
      timestamp: error.timestamp,
      code: error.code,
      message: error.message,
      severity,
      details: error.details
    };

    switch (severity) {
      case ErrorSeverity.LOW:
        console.info('Chat Error (Low):', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('Chat Error (Medium):', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('Chat Error (High):', logData);
        break;
      case ErrorSeverity.CRITICAL:
        console.error('Chat Error (Critical):', logData);
        // 重要なエラーは外部サービスに送信することも可能
        this.reportCriticalError(error);
        break;
    }
  }

  // 重要なエラーの報告
  private reportCriticalError(error: ChatError): void {
    // 実際の実装では、エラー監視サービス（Sentry、Bugsnag等）に送信
    console.error('Critical error reported:', error);
  }

  // エラーメッセージの取得
  getErrorMessage(code: string): string {
    return ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
  }

  // エラーの重要度取得
  getErrorSeverity(code: string): ErrorSeverity {
    return ERROR_SEVERITY[code] || ErrorSeverity.MEDIUM;
  }

  // 再試行可能なエラーかどうか
  isRetryableError(code: string): boolean {
    const retryableErrors = [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.CONNECTION_FAILED,
      ERROR_CODES.TIMEOUT,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      ERROR_CODES.WEBSOCKET_CONNECTION_FAILED
    ];
    return retryableErrors.includes(code);
  }

  // ユーザーアクションが必要なエラーかどうか
  requiresUserAction(code: string): boolean {
    const userActionErrors = [
      ERROR_CODES.UNAUTHORIZED,
      ERROR_CODES.TOKEN_EXPIRED,
      ERROR_CODES.INVALID_CREDENTIALS,
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_CODES.FILE_TOO_LARGE,
      ERROR_CODES.INVALID_FILE_TYPE
    ];
    return userActionErrors.includes(code);
  }
}

// シングルトンインスタンスのエクスポート
export const errorHandler = ErrorHandler.getInstance(); 
