/**
 * アプリケーション設定
 * 環境変数やハードコードされた設定値を一元管理
 */

// 環境変数から値を取得し、フォールバック値を提供
const getEnvVar = (key: string, fallback: string): string => {
  return import.meta.env[key] || fallback;
};

// API設定
export const API_CONFIG = {
  BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000'),
  TIMEOUT: 30000, // 30秒
};

// アセット設定
export const ASSETS_CONFIG = {
  // アバター画像設定
  DEFAULT_AVATAR_PATH: getEnvVar('VITE_DEFAULT_AVATAR_PATH', '/images/circle-user-round.png'),
  FALLBACK_AVATAR_PATH: getEnvVar('VITE_FALLBACK_AVATAR_PATH', '/images/default-avatar.png'),
  ASSETS_BASE_URL: getEnvVar('VITE_ASSETS_BASE_URL', ''),
  
  // 画像設定
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_IMAGE_DIMENSIONS: { width: 4000, height: 4000 },
  AVATAR_PREVIEW_SIZE: 200,
};

// アプリケーション設定
export const APP_CONFIG = {
  NAME: getEnvVar('VITE_APP_NAME', 'WorkOptimizer'),
  VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  ENVIRONMENT: getEnvVar('VITE_APP_ENV', 'development'),
  
  // ユーザー体験設定
  TOAST_DURATION: 4000,
  ERROR_TOAST_DURATION: 5000,
  AUTO_LOGOUT_DELAY: 2000,
};

// エラーハンドリング設定
export const ERROR_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  NETWORK_TIMEOUT: 10000,
};

// バリデーション設定
export const VALIDATION_CONFIG = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  DEPARTMENT_MAX_LENGTH: 100,
  POSITION_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 1000,
}; 
