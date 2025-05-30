# Work Optimizer Backend

Ruby on Rails APIサーバー

## 認証エラーコード一覧

### JWT認証エラー（ApplicationController::AuthErrorCodes）

| エラーコード | 説明 | 対処法 |
|-------------|------|--------|
| `AUTHENTICATION_REQUIRED` | 認証が必要 | ログインしてトークンを取得 |
| `TOKEN_MISSING` | トークンが存在しない | Authorizationヘッダーにトークンを設定 |
| `TOKEN_INVALID` | トークンが無効 | 有効なトークンで再認証 |
| `TOKEN_EXPIRED` | トークンが期限切れ | 新しいトークンを取得 |
| `TOKEN_MALFORMED` | トークンの形式が不正 | 正しい形式のトークンを使用 |
| `USER_NOT_FOUND` | ユーザーが見つからない | 有効なユーザーで再ログイン |
| `SESSION_EXPIRED` | セッションが期限切れ | 再ログインが必要 |

### ログインエラー（AuthController::LoginErrorCodes）

| エラーコード | 説明 | 対処法 |
|-------------|------|--------|
| `MISSING_PARAMETERS` | 必要なパラメータが不足 | メールアドレスとパスワードを入力 |
| `USER_NOT_FOUND` | ユーザーが見つからない | 正しいメールアドレスを入力 |
| `INVALID_PASSWORD` | パスワードが無効 | 正しいパスワードを入力 |

### パスワード変更エラー（AuthController::PasswordChangeErrorCodes）

| エラーコード | 説明 | 対処法 |
|-------------|------|--------|
| `MISSING_PARAMETERS` | 必要なパラメータが不足 | 全ての項目を入力 |
| `CURRENT_PASSWORD_INVALID` | 現在のパスワードが無効 | 正しい現在のパスワードを入力 |
| `PASSWORD_MISMATCH` | パスワードが一致しない | 新しいパスワードと確認用パスワードを一致させる |
| `PASSWORD_TOO_SHORT` | パスワードが短すぎる | 8文字以上のパスワードを設定 |
| `UPDATE_FAILED` | 更新に失敗 | エラー詳細を確認して修正 |

## フロントエンドでの使用例

```javascript
// エラーハンドリングの例
const handleAuthError = (error) => {
  const { code, message } = error.response.data;
  
  switch (code) {
    case 'TOKEN_EXPIRED':
      // トークン期限切れ - 自動的に再ログイン画面へ
      redirectToLogin();
      break;
    case 'TOKEN_INVALID':
      // 無効なトークン - ローカルストレージをクリアして再ログイン
      clearAuthToken();
      redirectToLogin();
      break;
    case 'USER_NOT_FOUND':
      // ユーザーが見つからない - 適切なエラーメッセージを表示
      showError('ユーザーが見つかりません');
      break;
    case 'PASSWORD_TOO_SHORT':
      // パスワードが短い - フォームバリデーションエラーを表示
      setFieldError('password', 'パスワードは8文字以上で入力してください');
      break;
    default:
      // その他のエラー - 汎用エラーメッセージ
      showError(message);
  }
};
```

## レスポンス形式

### 成功レスポンス
```json
{
  "success": true,
  "message": "成功しました",
  "data": { ... },
  "timestamp": "2024-12-20T10:30:00Z"
}
```

### エラーレスポンス
```json
{
  "success": false,
  "message": "エラーメッセージ",
  "code": "ERROR_CODE",
  "errors": ["詳細エラー1", "詳細エラー2"],
  "timestamp": "2024-12-20T10:30:00Z"
}
```

# README

This README would normally document whatever steps are necessary to get the
application up and running.

Things you may want to cover:

* Ruby version

* System dependencies

* Configuration

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...

## N+1問題対策

### 概要
UserSerializerで組織情報を表示する際のN+1問題を解決するため、eager loadingを実装しています。

### 実装内容

#### 1. コントローラーレベルでのeager loading
```ruby
# ApplicationController
def find_user_with_organizations(user_id)
  User.includes(organization_memberships: :organization).find(user_id)
end

def current_user_with_organizations
  return nil unless current_user
  @current_user_with_organizations ||= find_user_with_organizations(current_user.id)
end
```

#### 2. UserSerializerの最適化
- eager loadingされたassociationの検出
- フォールバック処理でのN+1問題回避
- 警告ログによる問題の早期発見

#### 3. パフォーマンス監視
```ruby
# ログ例：eager loadingされていない場合
Rails.logger.warn "UserSerializer#organizations: Association not preloaded, potential N+1 query"
```

### 使用例
```ruby
# ❌ N+1問題が発生する可能性
user = User.find(1)
UserSerializer.new(user) # organizationsでN+1クエリ

# ✅ N+1問題を回避
user = User.includes(organization_memberships: :organization).find(1)
UserSerializer.new(user) # 最適化されたクエリ
```

### パフォーマンステスト
```bash
# 開発環境でのクエリ監視
rails console
ActiveRecord::Base.logger = Logger.new(STDOUT)

# ユーザー取得テスト
user = User.includes(organization_memberships: :organization).first
UserSerializer.new(user).as_json
```
