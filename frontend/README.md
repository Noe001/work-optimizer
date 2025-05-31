# Frontend - Work Optimizer

React + TypeScript + Viteで構築されたフロントエンドアプリケーション

## 認証状態の一貫性管理

### 概要
AuthContextを中心とした認証状態の一元管理により、アプリケーション全体で一貫した認証状態を保持しています。

### 設計原則

#### 1. AuthContextによる中央集権的管理
- 認証状態（`isAuthenticated`）
- ユーザー情報（`user`）
- エラー状態（`error`）
- ローディング状態（`isLoading`）

#### 2. 認証操作の統一
```typescript
// ✅ 推奨：AuthContextを使用
const { signup, login, logout } = useAuth();
const result = await signup(signupData);

// ❌ 非推奨：APIを直接呼び出し
const response = await authAPI.signup(signupData);
localStorage.setItem('auth_token', response.data.token);
```

#### 3. 状態同期の自動化
```typescript
// 認証成功時の自動遷移
useEffect(() => {
  if (isAuthenticated) {
    navigate('/dashboard');
  }
}, [isAuthenticated, navigate]);

// エラー状態の自動同期
useEffect(() => {
  if (authError) {
    setError(authError);
  }
}, [authError]);
```

### 実装パターン

#### Signup.tsx / Login.tsx
```typescript
const SignupView: React.FC = () => {
  const { signup, isAuthenticated, error: authError, clearError } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // AuthContextの状態変化を監視
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard'); // 自動遷移
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (authError) {
      setError(authError); // エラー同期
    }
  }, [authError]);

  const handleSubmit = async (e: FormEvent) => {
    const result = await signup(signupData);
    // AuthContextが状態管理するため、手動でのnavigateやlocalStorage操作は不要
  };
};
```

### メリット

#### 1. 状態の一貫性
- 複数のコンポーネント間での認証状態のズレが発生しない
- localStorage とコンテキスト状態の同期が自動化

#### 2. エラーハンドリングの統一
- 認証エラーの統一的な処理
- 詳細なエラーコード（`TOKEN_EXPIRED`、`INVALID_CREDENTIALS`など）への対応

#### 3. 保守性の向上
- 認証ロジックの中央集権化
- テストの容易さ
- デバッグの簡素化

### 注意点

#### 1. 重複した状態管理の回避
```typescript
// ❌ 避けるべき：重複した状態管理
const [isAuthenticated, setIsAuthenticated] = useState(false);
const { isAuthenticated: authIsAuthenticated } = useAuth();

// ✅ 推奨：AuthContextの状態を信頼
const { isAuthenticated } = useAuth();
```

#### 2. 適切なエラークリア
```typescript
// 入力時にエラーをクリア
const handleInputChange = (value: string) => {
  setValue(value);
  if (error) {
    setError(null);
    clearError(); // AuthContextのエラーもクリア
  }
};
```

## APIレスポンス構造の最適化

### 概要
バックエンドの`render_success`メソッドで統一されたレスポンス構造により、フロントエンドでのデータ処理を簡潔にしています。

### バックエンドでの統一
```ruby
# ✅ 統一された実装
render_success(UserSerializer.new(user), 'メッセージ')

# ❌ 修正前：不統一な実装
render json: {
  success: true,
  data: UserSerializer.new(user).as_json,
  message: 'メッセージ'
}
```

### フロントエンドでの簡潔な処理
```typescript
// ✅ 修正後：簡潔な処理
if (response.success && response.data) {
  const userData = response.data as UserData;
  const profileData: UserProfile = {
    id: userData.id,
    name: userData.name || '',
    // ...
  };
}

// ❌ 修正前：不要な二重チェック
if (response.success && response.data) {
  let userData: any = response.data;
  if (userData.data && typeof userData.data === 'object') {
    userData = userData.data; // 不要な処理
  }
  // ...
}
```

### 型安全性の向上
- `UserProfile`型と`User`型の互換性確保
- `null`/`undefined`の適切な変換処理
- バックエンドAPI期待値との型整合性

## 詳細なエラーハンドリングシステム

### 概要
バックエンドのエラーコード定数と連携した、ユーザーフレンドリーなエラーハンドリングシステムを実装しています。

### エラーコード定数の活用

#### 型定義
```typescript
// エラーコード定数
export const AUTH_ERROR_CODES = {
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  // ...
} as const;

// 型安全なエラーハンドリング
export type ApiErrorCode = AuthErrorCode | LoginErrorCode | PasswordChangeErrorCode;
```

#### エラーハンドリングユーティリティ
```typescript
import { 
  getErrorMessage, 
  getRecommendedAction, 
  createDetailedError,
  shouldAutoLogout,
  shouldRedirectToLogin
} from '@/utils/errorHandler';

// エラーコードに基づく処理
const detailedError = createDetailedError(error);
const userMessage = getErrorMessage(detailedError);
const action = getRecommendedAction(detailedError);

switch (action) {
  case 'LOGOUT':
    logout();
    break;
  case 'FOCUS_PASSWORD':
    passwordRef.current?.focus();
    break;
  // ...
}
```

### 実装例

#### Login.tsx - ログインエラーハンドリング
```typescript
const handleErrorWithCodeHandling = (errorMessage: string, errorCode?: string) => {
  const detailedError = createDetailedError({ message: errorMessage, code: errorCode });
  const userFriendlyMessage = getErrorMessage(detailedError);
  const recommendedAction = getRecommendedAction(detailedError);
  
  setError(userFriendlyMessage);
  
  // エラーコードに基づくアクション実行
  switch (recommendedAction) {
    case 'FOCUS_EMAIL':
      setTimeout(() => emailRef.current?.focus(), 100);
      break;
    case 'FOCUS_PASSWORD':
      setTimeout(() => passwordRef.current?.focus(), 100);
      break;
    case 'HIGHLIGHT_REQUIRED':
      highlightRequiredFields();
      break;
  }
};
```

#### Profile.tsx - パスワード変更エラーハンドリング
```typescript
const handlePasswordError = (error: any) => {
  const detailedError = createDetailedError(error);
  const userFriendlyMessage = getErrorMessage(detailedError);
  const recommendedAction = getRecommendedAction(detailedError);
  
  // フィールド固有のエラーを設定
  const fieldErrors: {[key: string]: string} = {};
  
  switch (recommendedAction) {
    case 'FOCUS_CURRENT_PASSWORD':
      fieldErrors.currentPassword = userFriendlyMessage;
      setTimeout(() => currentPasswordRef.current?.focus(), 100);
      break;
    // ...
  }
  
  setPasswordErrors(fieldErrors);
};
```

### エラーコード対応表

#### 認証エラー（AUTH_ERROR_CODES）
| コード | アクション | 説明 |
|--------|------------|------|
| `TOKEN_EXPIRED` | `LOGOUT` | 自動ログアウト実行 |
| `TOKEN_INVALID` | `LOGOUT` | 自動ログアウト実行 |
| `AUTHENTICATION_REQUIRED` | `REDIRECT_LOGIN` | ログインページへリダイレクト |

#### ログインエラー（LOGIN_ERROR_CODES）
| コード | アクション | 説明 |
|--------|------------|------|
| `INVALID_PASSWORD` | `FOCUS_PASSWORD` | パスワードフィールドにフォーカス |
| `USER_NOT_FOUND` | `FOCUS_EMAIL` | メールフィールドにフォーカス |
| `MISSING_PARAMETERS` | `HIGHLIGHT_REQUIRED` | 必須フィールドをハイライト |

#### パスワード変更エラー（PASSWORD_CHANGE_ERROR_CODES）
| コード | アクション | 説明 |
|--------|------------|------|
| `CURRENT_PASSWORD_INVALID` | `FOCUS_CURRENT_PASSWORD` | 現在のパスワードフィールドにフォーカス |
| `PASSWORD_MISMATCH` | `FOCUS_NEW_PASSWORD` | 新しいパスワードフィールドにフォーカス |
| `PASSWORD_TOO_SHORT` | `FOCUS_NEW_PASSWORD` | 新しいパスワードフィールドにフォーカス |

### メリット

#### 1. ユーザー体験の向上
- エラーコードに基づく適切なフィールドフォーカス
- ユーザーフレンドリーなエラーメッセージ
- 一貫したエラー表示スタイル

#### 2. 開発者体験の向上
- 型安全なエラーハンドリング
- 再利用可能なエラーハンドリングロジック
- 統一されたエラーレスポンス構造

#### 3. 保守性の向上
- エラーコードの中央管理
- バックエンドとフロントエンドの一貫性
- デバッグの容易さ

### 使用ガイドライン

#### エラーハンドリングのベストプラクティス
```typescript
// ✅ 推奨：詳細なエラーハンドリング
try {
  const response = await apiCall();
} catch (error) {
  const detailedError = createDetailedError(error);
  
  if (shouldAutoLogout(detailedError)) {
    logout();
    navigate('/login');
  } else {
    const message = getErrorMessage(detailedError);
    setError(message);
  }
}

// ❌ 非推奨：汎用的なエラーハンドリング
try {
  const response = await apiCall();
} catch (error) {
  setError('エラーが発生しました');
}
```

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```

# frontend/.env.local
```md
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_ENV=development
```

## アバター画像管理システム

### 概要
環境変数による設定管理と堅牢なエラーハンドリングを備えたアバター画像管理システムを実装しています。

### 設計原則

#### 1. 設定の一元管理
```typescript
// config/app.ts
export const ASSETS_CONFIG = {
  DEFAULT_AVATAR_PATH: getEnvVar('VITE_DEFAULT_AVATAR_PATH', '/images/circle-user-round.png'),
  FALLBACK_AVATAR_PATH: getEnvVar('VITE_FALLBACK_AVATAR_PATH', '/images/default-avatar.png'),
  ASSETS_BASE_URL: getEnvVar('VITE_ASSETS_BASE_URL', ''),
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_IMAGE_DIMENSIONS: { width: 4000, height: 4000 },
  AVATAR_PREVIEW_SIZE: 200,
};
```

#### 2. 堅牢なエラーハンドリング
```typescript
// utils/avatarUtils.ts
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
```

### 機能詳細

#### 1. **フォールバック機能**
- ユーザー画像 → デフォルト画像 → フォールバック画像の3段階フォールバック
- 画像読み込みエラーの自動検出と記録
- リトライ制限による無限ループ防止

#### 2. **エラー状態管理**
```typescript
// エラーの記録と管理
const imageErrors = new Set<string>();
const imageLoadAttempts = new Map<string, number>();

// エラー画像の自動ブロック
if (attempts >= 3) {
  console.error(`Avatar image permanently failed after ${attempts} attempts: ${imageSrc}`);
}
```

#### 3. **画像最適化**
- アップロード時の自動リサイズ（設定可能）
- ファイルサイズ制限（5MB）
- 対応形式の検証（JPEG、PNG、WebP、GIF）
- 最大解像度制限（4000x4000px）

### 環境変数による設定

#### 推奨環境変数
```bash
# .env.local
VITE_DEFAULT_AVATAR_PATH=/images/circle-user-round.png
VITE_FALLBACK_AVATAR_PATH=/images/default-avatar.png
VITE_ASSETS_BASE_URL=https://cdn.example.com
```

#### 環境別設定例
```typescript
// 本番環境
VITE_ASSETS_BASE_URL=https://cdn.workoptimizer.com
VITE_DEFAULT_AVATAR_PATH=/avatars/default.png

// 開発環境
VITE_ASSETS_BASE_URL=
VITE_DEFAULT_AVATAR_PATH=/images/circle-user-round.png

// テスト環境
VITE_DEFAULT_AVATAR_PATH=/test/mock-avatar.png
VITE_FALLBACK_AVATAR_PATH=/test/fallback.png
```

### 使用例

#### コンポーネントでの使用
```typescript
import { createAvatarProps } from '@/utils/avatarUtils';

// ❌ 修正前：ハードコードされたパス
<img 
  src={user.avatarUrl || '/images/circle-user-round.png'} 
  alt="ユーザーアバター" 
  className="w-8 h-8 rounded-full" 
/>

// ✅ 修正後：エラーハンドリング付き
<img 
  {...createAvatarProps(user.avatarUrl, user.name, 'ユーザーアバター')}
  className="w-8 h-8 rounded-full" 
/>
```

#### 画像の事前読み込み
```typescript
import { preloadImage, preloadImages } from '@/utils/avatarUtils';

// 単一画像の事前読み込み
const success = await preloadImage(user.avatarUrl);

// 複数画像の事前読み込み
const results = await preloadImages([
  user.avatarUrl,
  DEFAULT_AVATAR_PATH,
  FALLBACK_AVATAR_PATH
]);
```

### メリット

#### 1. **保守性の向上**
- 設定の一元管理により変更が容易
- 環境別設定による柔軟な運用
- ハードコードされたパスの削除

#### 2. **ユーザー体験の向上**
- 画像読み込みエラーの自動フォールバック
- 滑らかな画像表示（エラー時も中断なし）
- 適切な代替テキストの自動生成

#### 3. **開発者体験の向上**
- 統一されたAPI（`createAvatarProps`）
- TypeScriptによる型安全性
- 包括的なエラーログ

#### 4. **パフォーマンス最適化**
- 画像エラーの記録による不要なリクエスト削減
- 事前読み込み機能による高速表示
- 自動リサイズによる帯域幅節約

### テスト

#### エラーハンドリングのテスト
```typescript
import { resetImageErrorState, handleImageError } from '@/utils/avatarUtils';

beforeEach(() => {
  resetImageErrorState(); // テスト間でエラー状態をクリア
});

test('should fallback to default image on error', () => {
  const fallbackSrc = handleImageError('https://invalid-url.com/avatar.jpg');
  expect(fallbackSrc).toBe(ASSETS_CONFIG.DEFAULT_AVATAR_PATH);
});
```

この実装により、単純なハードコードされたパスから、環境に応じて柔軟に設定でき、エラーにも堅牢に対応するアバター画像管理システムへと大幅に改善されました。
