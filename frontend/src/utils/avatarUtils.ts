import { ASSETS_CONFIG } from '@/config/app';

/**
 * アバター画像のユーティリティ関数
 * エラーハンドリングとフォールバック機能を提供
 */

// アバター画像のエラー状態を管理
const imageErrors = new Set<string>();
const imageLoadAttempts = new Map<string, number>();

/**
 * アバター画像のURLを安全に取得
 * @param avatarUrl ユーザーのアバター画像URL
 * @param userName ユーザー名（ログ用）
 * @returns 安全なアバター画像URL
 */
export function getAvatarUrl(avatarUrl?: string | null, userName?: string): string {
  // ユーザーのアバター画像が存在し、エラーが記録されていない場合
  if (avatarUrl && !imageErrors.has(avatarUrl)) {
    return avatarUrl;
  }
  
  // デフォルト画像にフォールバック
  const defaultPath = ASSETS_CONFIG.DEFAULT_AVATAR_PATH;
  
  // デフォルト画像もエラーの場合はさらにフォールバック
  if (imageErrors.has(defaultPath)) {
    return ASSETS_CONFIG.FALLBACK_AVATAR_PATH;
  }
  
  return defaultPath;
}

/**
 * 画像読み込みエラーのハンドラー
 * @param imageSrc エラーが発生した画像のURL
 * @param userName ユーザー名（ログ用）
 * @returns フォールバック画像のURL
 */
export function handleImageError(imageSrc: string, userName?: string): string {
  console.warn(`Avatar image failed to load: ${imageSrc}${userName ? ` for user: ${userName}` : ''}`);
  
  // エラーを記録
  imageErrors.add(imageSrc);
  
  // リトライ回数を増加
  const attempts = imageLoadAttempts.get(imageSrc) || 0;
  imageLoadAttempts.set(imageSrc, attempts + 1);
  
  // 最大リトライ回数を超えた場合は完全にブロック
  if (attempts >= 3) {
    console.error(`Avatar image permanently failed after ${attempts} attempts: ${imageSrc}`);
  }
  
  // フォールバック画像を返す
  const defaultPath = ASSETS_CONFIG.DEFAULT_AVATAR_PATH;
  
  // デフォルト画像自体がエラーの場合
  if (imageSrc === defaultPath) {
    return ASSETS_CONFIG.FALLBACK_AVATAR_PATH;
  }
  
  return defaultPath;
}

/**
 * 画像の読み込み成功時のハンドラー
 * @param imageSrc 読み込みに成功した画像のURL
 */
export function handleImageLoad(imageSrc: string): void {
  // エラー状態をクリア
  if (imageErrors.has(imageSrc)) {
    imageErrors.delete(imageSrc);
    imageLoadAttempts.delete(imageSrc);
  }
}

/**
 * 画像URLの検証
 * @param url 検証する画像URL
 * @returns URLが有効かどうか
 */
export function isValidImageUrl(url: string): boolean {
  try {
    new URL(url, window.location.origin);
    return true;
  } catch {
    return false;
  }
}

/**
 * Base64データURLかどうかを判定
 * @param url 判定するURL
 * @returns Base64データURLかどうか
 */
export function isDataUrl(url: string): boolean {
  return url.startsWith('data:image/');
}

/**
 * 画像の事前読み込み
 * @param url 事前読み込みする画像のURL
 * @returns Promise<boolean> 読み込み成功/失敗
 */
export function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url || imageErrors.has(url)) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      handleImageLoad(url);
      resolve(true);
    };
    
    img.onerror = () => {
      handleImageError(url);
      resolve(false);
    };
    
    img.src = url;
  });
}

/**
 * 複数の画像を事前読み込み
 * @param urls 事前読み込みする画像URLの配列
 * @returns Promise<boolean[]> 各画像の読み込み結果
 */
export async function preloadImages(urls: string[]): Promise<boolean[]> {
  return Promise.all(urls.map(url => preloadImage(url)));
}

/**
 * エラー状態をリセット（テスト用やキャッシュクリア用）
 */
export function resetImageErrorState(): void {
  imageErrors.clear();
  imageLoadAttempts.clear();
}

/**
 * 画像URLを正規化
 * @param url 正規化する画像URL
 * @returns 正規化された画像URL
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return ASSETS_CONFIG.DEFAULT_AVATAR_PATH;
  
  // Base64データURLの場合はそのまま返す
  if (isDataUrl(url)) {
    return url;
  }
  
  // 相対パスの場合はベースURLを追加
  if (url.startsWith('/') && ASSETS_CONFIG.ASSETS_BASE_URL) {
    return `${ASSETS_CONFIG.ASSETS_BASE_URL}${url}`;
  }
  
  return url;
}

/**
 * アバター画像のコンポーネントプロップスを生成
 * @param avatarUrl ユーザーのアバター画像URL
 * @param userName ユーザー名
 * @param alt 代替テキスト
 * @returns 画像コンポーネント用のプロップス
 */
export function createAvatarProps(
  avatarUrl?: string | null,
  userName?: string,
  alt?: string
) {
  const src = normalizeImageUrl(getAvatarUrl(avatarUrl, userName));
  
  return {
    src,
    alt: alt || `${userName || 'ユーザー'}のアバター`,
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const fallbackSrc = handleImageError(img.src, userName);
      if (img.src !== fallbackSrc) {
        img.src = fallbackSrc;
      }
    },
    onLoad: () => {
      handleImageLoad(src);
    },
  };
} 
