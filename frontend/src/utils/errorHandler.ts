import { toast } from 'sonner';
import { 
  AUTH_ERROR_CODES, 
  LOGIN_ERROR_CODES, 
  PASSWORD_CHANGE_ERROR_CODES,
  ApiErrorCode,
  DetailedApiError,
  ApiError 
} from '@/types/api';

// エラーメッセージのマッピング
export const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  // 認証エラーコード
  [AUTH_ERROR_CODES.AUTHENTICATION_REQUIRED]: '認証が必要です。ログインしてください。',
  [AUTH_ERROR_CODES.TOKEN_MISSING]: '認証トークンが不足しています。再度ログインしてください。',
  [AUTH_ERROR_CODES.TOKEN_INVALID]: '認証トークンが無効です。再度ログインしてください。',
  [AUTH_ERROR_CODES.TOKEN_EXPIRED]: '認証の有効期限が切れています。再度ログインしてください。',
  [AUTH_ERROR_CODES.TOKEN_MALFORMED]: '認証情報に問題があります。再度ログインしてください。',
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: 'ユーザーが見つかりません。',
  [AUTH_ERROR_CODES.SESSION_EXPIRED]: 'セッションが期限切れです。再度ログインしてください。',

  // ログインエラーコード
  [LOGIN_ERROR_CODES.INVALID_CREDENTIALS]: 'メールアドレスまたはパスワードが正しくありません。',
  [LOGIN_ERROR_CODES.USER_NOT_FOUND]: 'メールアドレスまたはパスワードが正しくありません。',
  [LOGIN_ERROR_CODES.INVALID_PASSWORD]: 'メールアドレスまたはパスワードが正しくありません。',
  [LOGIN_ERROR_CODES.MISSING_PARAMETERS]: 'メールアドレスとパスワードを入力してください。',

  // パスワード変更エラーコード
  [PASSWORD_CHANGE_ERROR_CODES.MISSING_PARAMETERS]: '必要な項目をすべて入力してください。',
  [PASSWORD_CHANGE_ERROR_CODES.CURRENT_PASSWORD_INVALID]: '現在のパスワードが正しくありません。',
  [PASSWORD_CHANGE_ERROR_CODES.PASSWORD_MISMATCH]: '新しいパスワードと確認用パスワードが一致しません。',
  [PASSWORD_CHANGE_ERROR_CODES.PASSWORD_TOO_SHORT]: 'パスワードは8文字以上で入力してください。',
  [PASSWORD_CHANGE_ERROR_CODES.UPDATE_FAILED]: 'パスワードの変更に失敗しました。もう一度お試しください。',
};

// ユーザーアクションのタイプ
export type UserAction = 
  | 'LOGOUT'
  | 'REDIRECT_LOGIN' 
  | 'FOCUS_EMAIL'
  | 'FOCUS_PASSWORD'
  | 'FOCUS_CURRENT_PASSWORD'
  | 'FOCUS_NEW_PASSWORD'
  | 'FOCUS_CONFIRM_PASSWORD'
  | 'HIGHLIGHT_REQUIRED'
  | 'SHOW_RETRY'
  | 'NONE';

// エラーコードに対する推奨アクション
export const ERROR_ACTIONS: Record<ApiErrorCode, UserAction> = {
  // 認証エラー → ログアウト・ログインページへ
  [AUTH_ERROR_CODES.AUTHENTICATION_REQUIRED]: 'REDIRECT_LOGIN',
  [AUTH_ERROR_CODES.TOKEN_MISSING]: 'REDIRECT_LOGIN',
  [AUTH_ERROR_CODES.TOKEN_INVALID]: 'LOGOUT',
  [AUTH_ERROR_CODES.TOKEN_EXPIRED]: 'LOGOUT',
  [AUTH_ERROR_CODES.TOKEN_MALFORMED]: 'LOGOUT',
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: 'LOGOUT',
  [AUTH_ERROR_CODES.SESSION_EXPIRED]: 'REDIRECT_LOGIN',

  // ログインエラー → フィールドフォーカス
  [LOGIN_ERROR_CODES.INVALID_CREDENTIALS]: 'FOCUS_EMAIL',
  [LOGIN_ERROR_CODES.USER_NOT_FOUND]: 'FOCUS_EMAIL',
  [LOGIN_ERROR_CODES.INVALID_PASSWORD]: 'FOCUS_PASSWORD',
  [LOGIN_ERROR_CODES.MISSING_PARAMETERS]: 'HIGHLIGHT_REQUIRED',

  // パスワード変更エラー → 該当フィールドフォーカス
  [PASSWORD_CHANGE_ERROR_CODES.MISSING_PARAMETERS]: 'HIGHLIGHT_REQUIRED',
  [PASSWORD_CHANGE_ERROR_CODES.CURRENT_PASSWORD_INVALID]: 'FOCUS_CURRENT_PASSWORD',
  [PASSWORD_CHANGE_ERROR_CODES.PASSWORD_MISMATCH]: 'FOCUS_NEW_PASSWORD',
  [PASSWORD_CHANGE_ERROR_CODES.PASSWORD_TOO_SHORT]: 'FOCUS_NEW_PASSWORD',
  [PASSWORD_CHANGE_ERROR_CODES.UPDATE_FAILED]: 'SHOW_RETRY',
};

/**
 * APIエラーをユーザーフレンドリーなメッセージに変換
 * 任意のエラー形式に対応（既存の型安全性を維持しつつ、柔軟性を向上）
 */
export function getErrorMessage(error: any): string {
  // 既存のApiError形式の処理（型安全性を維持）
  if (error?.code && isValidErrorCode(error.code)) {
    return ERROR_MESSAGES[error.code as ApiErrorCode];
  }
  
  // Axiosエラーレスポンスの処理
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  // 直接的なメッセージの処理
  if (error?.message) {
    return error.message;
  }
  
  // 既存のApiError形式
  if (typeof error === 'object' && error.message) {
    return error.message;
  }
  
  return 'エラーが発生しました。';
}

/**
 * エラーコードに基づく推奨アクションを取得
 */
export function getRecommendedAction(error: ApiError): UserAction {
  if (error.code && isValidErrorCode(error.code)) {
    return ERROR_ACTIONS[error.code as ApiErrorCode];
  }
  return 'NONE';
}

/**
 * 認証エラーかどうかを判定
 */
export function isAuthError(error: ApiError): boolean {
  if (!error.code) return false;
  return Object.values(AUTH_ERROR_CODES).includes(error.code as any);
}

/**
 * ログインエラーかどうかを判定
 */
export function isLoginError(error: ApiError): boolean {
  if (!error.code) return false;
  return Object.values(LOGIN_ERROR_CODES).includes(error.code as any);
}

/**
 * パスワード変更エラーかどうかを判定
 */
export function isPasswordChangeError(error: ApiError): boolean {
  if (!error.code) return false;
  return Object.values(PASSWORD_CHANGE_ERROR_CODES).includes(error.code as any);
}

/**
 * 自動ログアウトが必要なエラーかどうかを判定
 */
export function shouldAutoLogout(error: ApiError): boolean {
  if (!error.code) return false;
  
  const autoLogoutCodes = [
    AUTH_ERROR_CODES.TOKEN_INVALID,
    AUTH_ERROR_CODES.TOKEN_EXPIRED,
    AUTH_ERROR_CODES.TOKEN_MALFORMED,
    AUTH_ERROR_CODES.USER_NOT_FOUND,
  ];
  
  return autoLogoutCodes.includes(error.code as any);
}

/**
 * ログインページへのリダイレクトが必要なエラーかどうかを判定
 */
export function shouldRedirectToLogin(error: ApiError): boolean {
  if (!error.code) return false;
  
  const redirectCodes = [
    AUTH_ERROR_CODES.AUTHENTICATION_REQUIRED,
    AUTH_ERROR_CODES.TOKEN_MISSING,
    AUTH_ERROR_CODES.SESSION_EXPIRED,
  ];
  
  return redirectCodes.includes(error.code as any);
}

/**
 * 有効なエラーコードかどうかを判定
 */
function isValidErrorCode(code: string): code is ApiErrorCode {
  const allErrorCodes = [
    ...Object.values(AUTH_ERROR_CODES),
    ...Object.values(LOGIN_ERROR_CODES),
    ...Object.values(PASSWORD_CHANGE_ERROR_CODES),
  ];
  return allErrorCodes.includes(code as any);
}

/**
 * エラーオブジェクトからDetailedApiErrorを作成
 */
export function createDetailedError(error: any): DetailedApiError {
  if (error?.response?.data) {
    return {
      message: error.response.data.message || 'エラーが発生しました',
      code: error.response.data.code as ApiErrorCode,
      errors: error.response.data.errors || [],
      timestamp: error.response.data.timestamp,
    };
  }
  
  if (error?.code && isValidErrorCode(error.code)) {
    return {
      message: error.message || 'エラーが発生しました',
      code: error.code as ApiErrorCode,
      errors: error.errors || [],
      timestamp: error.timestamp,
    };
  }
  
  return {
    message: error?.message || 'エラーが発生しました',
    code: 'UNKNOWN_ERROR' as ApiErrorCode,
    errors: [],
  };
}

/**
 * エラートースト表示用のオプション生成
 */
export function createToastOptions(error: ApiError) {
  const isError = true;
  const duration = isAuthError(error) ? 5000 : 4000; // 認証エラーは少し長く表示
  
  return {
    title: 'エラー',
    description: getErrorMessage(error),
    variant: 'destructive' as const,
    duration,
  };
}

/**
 * バリデーションエラーの処理
 * バックエンドから返される詳細なエラーメッセージ配列を処理
 */
export function formatValidationErrors(errors: string[]): string {
  if (!errors || errors.length === 0) {
    return 'エラーが発生しました。';
  }
  
  // 複数のエラーがある場合は改行で区切る
  if (errors.length === 1) {
    return errors[0];
  }
  
  return errors.join('\n');
}

/**
 * フィールド固有のバリデーションエラーを抽出
 * i18nから返されるエラーメッセージを解析してフィールドごとに分類
 */
export function extractFieldErrors(errors: string[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  
  if (!errors || errors.length === 0) {
    return fieldErrors;
  }
  
  errors.forEach(error => {
    // 日本語のエラーメッセージから対応するフィールドを推測
    if (error.includes('名前')) {
      fieldErrors.name = error;
    } else if (error.includes('メールアドレス')) {
      fieldErrors.email = error;
    } else if (error.includes('パスワード')) {
      if (error.includes('確認')) {
        fieldErrors.password_confirmation = error;
      } else {
        fieldErrors.password = error;
      }
    } else if (error.includes('部署')) {
      fieldErrors.department = error;
    } else if (error.includes('役職')) {
      fieldErrors.position = error;
    } else if (error.includes('自己紹介')) {
      fieldErrors.bio = error;
    } else {
      // フィールドが特定できない場合は汎用エラーとして保存
      fieldErrors.general = error;
    }
  });
  
  return fieldErrors;
}

/**
 * エラーの優先度に基づいてソート
 * より重要なエラーを最初に表示
 */
export function sortErrorsByPriority(errors: string[]): string[] {
  const priorityOrder = [
    '名前', 'メールアドレス', 'パスワード', '部署', '役職', '自己紹介'
  ];
  
  return errors.sort((a, b) => {
    const aIndex = priorityOrder.findIndex(field => a.includes(field));
    const bIndex = priorityOrder.findIndex(field => b.includes(field));
    
    // 優先度が見つからない場合は後ろに
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    return aIndex - bIndex;
  });
}

/**
 * エラーオブジェクトから統合エラー情報を作成
 * バリデーションエラーとAPIエラーの両方を適切に処理
 */
export function createUnifiedError(error: any): {
  message: string;
  fieldErrors: Record<string, string>;
  generalErrors: string[];
} {
  const detailedError = createDetailedError(error);
  let message = getErrorMessage(detailedError);
  let fieldErrors: Record<string, string> = {};
  let generalErrors: string[] = [];
  
  // バリデーションエラーの詳細処理
  if (detailedError.errors && detailedError.errors.length > 0) {
    const sortedErrors = sortErrorsByPriority(detailedError.errors);
    fieldErrors = extractFieldErrors(sortedErrors);
    
    // フィールドに分類されなかったエラーを一般エラーとして保持
    generalErrors = sortedErrors.filter(err => 
      !Object.values(fieldErrors).includes(err)
    );
    
    // メインメッセージを最初のエラーで更新（より具体的）
    if (sortedErrors.length > 0) {
      message = sortedErrors[0];
    }
  }
  
  return {
    message,
    fieldErrors,
    generalErrors
  };
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  errors?: string[];
  timestamp?: string;
}

export interface ApiErrorResponse {
  response?: {
    data?: ApiError;
    status?: number;
  };
  message?: string;
}

export class ErrorHandler {
  /**
   * 統合エラーハンドリング
   * 既存の関数と統合し、重複を排除
   */
  static handle(error: any, context?: string): void {
    console.error(`=== エラー発生 ${context ? `(${context})` : ''} ===`);
    console.error('エラーオブジェクト:', error);
    
    // 統一されたgetErrorMessage関数を使用
    const message = getErrorMessage(error);
      
      // 詳細エラーがある場合は追加表示
    if (error?.response?.data?.errors && error.response.data.errors.length > 0) {
      console.error('詳細エラー:', error.response.data.errors);
    }
    
    if (error?.response?.data?.code) {
      console.error('APIエラーコード:', error.response.data.code);
    }
    
    if (error?.response?.status) {
      console.error('HTTPステータス:', error.response.status);
    }
    
    toast.error(message);
  }

  static handleValidation(errors: string[]): void {
    const message = formatValidationErrors(errors);
    toast.error(message);
  }

  static handleNetwork(): void {
    toast.error('ネットワークエラーが発生しました。接続を確認してください。');
  }

  static handleUnauthorized(): void {
    toast.error('認証が必要です。ログインしてください。');
  }

  static handleForbidden(): void {
    toast.error('この操作を実行する権限がありません。');
  }

  static handleNotFound(resource?: string): void {
    const message = resource ? `${resource}が見つかりません` : 'リソースが見つかりません';
    toast.error(message);
  }

  static handleServerError(): void {
    toast.error('サーバーエラーが発生しました。しばらく時間をおいて再試行してください。');
  }

  /**
   * @deprecated getErrorMessage関数を直接使用してください
   */
  static getErrorMessage(error: any): string {
    return getErrorMessage(error);
  }

  static isNetworkError(error: any): boolean {
    return !error?.response && error?.message?.includes('Network Error');
  }

  static getStatusCode(error: any): number | null {
    return error?.response?.status || null;
  }
} 
