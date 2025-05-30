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
