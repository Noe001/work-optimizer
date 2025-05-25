# チャット機能 API ドキュメント

このドキュメントでは、WorkOptimizerアプリケーションのチャット機能に関するAPIエンドポイントについて説明します。

## 認証

すべてのAPIリクエストには認証が必要です。認証方法は以下の2つがあります：

1. **JWTトークン**: リクエストヘッダーに `Authorization: Bearer <token>` を含める
2. **セッション認証**: Cookieベースのセッション認証

## チャットルーム関連 API

### チャットルーム一覧の取得

```
GET /api/chat_rooms
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "direct_messages": [
      {
        "id": "uuid-string",
        "name": "DM",
        "is_direct_message": true,
        "created_at": "2025-05-25T07:00:00.000Z",
        "updated_at": "2025-05-25T07:00:00.000Z",
        "users": [
          {
            "id": "user-uuid-1",
            "name": "ユーザー1"
          },
          {
            "id": "user-uuid-2",
            "name": "ユーザー2"
          }
        ]
      }
    ],
    "channels": [
      {
        "id": "uuid-string",
        "name": "一般",
        "is_direct_message": false,
        "created_at": "2025-05-25T07:00:00.000Z",
        "updated_at": "2025-05-25T07:00:00.000Z",
        "users": [
          {
            "id": "user-uuid-1",
            "name": "ユーザー1"
          },
          {
            "id": "user-uuid-2",
            "name": "ユーザー2"
          }
        ]
      }
    ]
  }
}
```

### チャットルーム詳細の取得

```
GET /api/chat_rooms/:id
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "一般",
    "is_direct_message": false,
    "created_at": "2025-05-25T07:00:00.000Z",
    "updated_at": "2025-05-25T07:00:00.000Z",
    "users": [
      {
        "id": "user-uuid-1",
        "name": "ユーザー1"
      },
      {
        "id": "user-uuid-2",
        "name": "ユーザー2"
      }
    ]
  }
}
```

### チャットルームの作成

```
POST /api/chat_rooms
```

**リクエスト例（グループチャット）**:

```json
{
  "chat_room": {
    "name": "プロジェクトA",
    "is_direct_message": false
  },
  "user_ids": ["user-uuid-1", "user-uuid-2"]
}
```

**リクエスト例（ダイレクトメッセージ）**:

```json
{
  "chat_room": {
    "is_direct_message": true
  },
  "user_ids": ["user-uuid-2"]
}
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "プロジェクトA",
    "is_direct_message": false,
    "created_at": "2025-05-25T07:00:00.000Z",
    "updated_at": "2025-05-25T07:00:00.000Z",
    "users": [
      {
        "id": "user-uuid-1",
        "name": "ユーザー1"
      },
      {
        "id": "user-uuid-2",
        "name": "ユーザー2"
      }
    ]
  }
}
```

### チャットルームの更新

```
PUT /api/chat_rooms/:id
```

**リクエスト例**:

```json
{
  "chat_room": {
    "name": "プロジェクトA（更新）"
  }
}
```

### チャットルームの削除

```
DELETE /api/chat_rooms/:id
```

### チャットルームにメンバーを追加

```
POST /api/chat_rooms/:id/add_member
```

**リクエスト例**:

```json
{
  "user_id": "user-uuid-3",
  "role": "member"
}
```

### チャットルームからメンバーを削除

```
DELETE /api/chat_rooms/:id/remove_member/:user_id
```

## メッセージ関連 API

### メッセージ一覧の取得

```
GET /api/chat_rooms/:chat_room_id/messages
```

**クエリパラメータ**:

- `page`: ページ番号（デフォルト: 1）
- `per_page`: 1ページあたりのメッセージ数（デフォルト: 20）

**レスポンス例**:

```json
{
  "success": true,
  "data": [
    {
      "id": "message-uuid-1",
      "content": "こんにちは！",
      "chat_room_id": "chat-room-uuid",
      "user_id": "user-uuid-1",
      "read": true,
      "read_at": "2025-05-25T07:05:00.000Z",
      "created_at": "2025-05-25T07:00:00.000Z",
      "updated_at": "2025-05-25T07:00:00.000Z",
      "user_name": "ユーザー1",
      "attachment_url": null,
      "user": {
        "id": "user-uuid-1",
        "name": "ユーザー1"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 100
  }
}
```

### メッセージの送信

```
POST /api/chat_rooms/:chat_room_id/messages
```

**リクエスト例**:

```json
{
  "message": {
    "content": "こんにちは！"
  }
}
```

**添付ファイル付きのリクエスト**:

マルチパートフォームデータとして送信:

- `message[content]`: メッセージ内容
- `attachment`: ファイル

### メッセージの更新

```
PUT /api/chat_rooms/:chat_room_id/messages/:id
```

**リクエスト例**:

```json
{
  "message": {
    "content": "こんにちは！（編集済み）"
  }
}
```

### メッセージの削除

```
DELETE /api/chat_rooms/:chat_room_id/messages/:id
```

### すべてのメッセージを既読にする

```
POST /api/chat_rooms/:chat_room_id/messages/read_all
```

## WebSocket (Action Cable)

### 接続

```
ws://localhost:3000/cable
```

認証ヘッダーを含める必要があります:

```
Authorization: Bearer <token>
```

### チャットルームのサブスクライブ

```javascript
App.cable.subscriptions.create(
  {
    channel: "ChatChannel",
    chat_room_id: "chat-room-uuid"
  },
  {
    connected() {
      console.log("Connected to ChatChannel");
    },
    disconnected() {
      console.log("Disconnected from ChatChannel");
    },
    received(data) {
      console.log("Received data:", data);
      // メッセージの処理
    },
    typing() {
      this.perform("typing");
    }
  }
);
```

### メッセージの送信

```javascript
App.cable.subscriptions.subscriptions[0].perform("receive", {
  content: "こんにちは！",
  attachment_signed_id: "signed-id-from-active-storage"
});
```

### 入力中ステータスの送信

```javascript
App.cable.subscriptions.subscriptions[0].perform("typing");
```

## フロントエンドとの連携

フロントエンドの `TeamChat.tsx` コンポーネントと連携するには、以下の実装が必要です:

1. `frontend/src/services/api.ts` に以下のAPIメソッドを追加:

```typescript
// チャットルーム一覧の取得
getChatRooms: () => api.get<ApiResponse<{
  direct_messages: DirectMessage[];
  channels: Channel[];
}>>('/api/chat_rooms'),

// チャットルームの作成
createChatRoom: (data: {
  chat_room: {
    name?: string;
    is_direct_message: boolean;
  };
  user_ids?: string[];
}) => api.post<ApiResponse<ChatRoom>>('/api/chat_rooms', data),

// メッセージ履歴の取得
getChatMessages: (chatRoomId: string, page = 1, perPage = 20) => 
  api.get<ApiResponse<Message[]>>(`/api/chat_rooms/${chatRoomId}/messages?page=${page}&per_page=${perPage}`),

// メッセージの送信
sendMessage: (chatRoomId: string, content: string, attachment?: File) => {
  const formData = new FormData();
  formData.append('message[content]', content);
  if (attachment) {
    formData.append('attachment', attachment);
  }
  return api.post<ApiResponse<Message>>(`/api/chat_rooms/${chatRoomId}/messages`, formData);
}
```

2. Action Cableの接続設定:

```typescript
import { createConsumer } from '@rails/actioncable';

// トークンを取得
const token = localStorage.getItem('token');

// Action Cable接続の作成
const consumer = createConsumer(`ws://localhost:3000/cable?token=${token}`);

// チャットルームのサブスクライブ
const subscription = consumer.subscriptions.create(
  {
    channel: 'ChatChannel',
    chat_room_id: chatRoomId
  },
  {
    connected() {
      console.log('Connected to ChatChannel');
    },
    disconnected() {
      console.log('Disconnected from ChatChannel');
    },
    received(data) {
      // 新しいメッセージを受信したときの処理
      if (data.message) {
        setMessages(prev => [data.message, ...prev]);
      }
      // メッセージ更新の処理
      else if (data.message_updated) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.message_updated.id ? data.message_updated : msg
        ));
      }
      // メッセージ削除の処理
      else if (data.message_deleted) {
        setMessages(prev => prev.filter(msg => msg.id !== data.message_deleted.id));
      }
      // 入力中ステータスの処理
      else if (data.typing) {
        setTypingUsers(prev => [...prev, data.typing.user_name]);
        // 数秒後に入力中ステータスを消す
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(name => name !== data.typing.user_name));
        }, 3000);
      }
    },
    // 入力中ステータスの送信
    typing() {
      this.perform('typing');
    }
  }
);
```

これらの実装により、フロントエンドの `TeamChat.tsx` コンポーネントからバックエンドのチャット機能を利用できるようになります。
