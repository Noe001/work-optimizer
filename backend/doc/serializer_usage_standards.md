# プロジェクト内シリアライザー使用統一ガイドライン

## 現在の状況

プロジェクト全体で`ActiveModel::Serializer`を使用しており、`JSONAPI::Serializer`は使用していません。

### 使用中のGem
```ruby
# Gemfile
gem "active_model_serializers", "~> 0.10.13"
```

### シリアライザーファイル一覧
- `TaskSerializer < ActiveModel::Serializer`
- `UserSerializer < ActiveModel::Serializer`
- `ManualSerializer < ActiveModel::Serializer`

## 推奨パターン（ManualsController方式）

### ✅ 単一オブジェクトのシリアライズ
```ruby
def manual_response(manual, message: nil, status: :ok)
  serialized_data = ManualSerializer.new(manual, current_user: current_user).as_json
  
  response_body = {
    success: true,
    data: serialized_data
  }
  response_body[:message] = message if message.present?
  
  render json: response_body, status: status
end
```

### ✅ コレクションのシリアライズ（エラーハンドリング付き）
```ruby
def serialize_manual_collection(paginated)
  begin
    # ActiveModel::Serializer::CollectionSerializer を使用
    ActiveModel::Serializer::CollectionSerializer.new(
      paginated, 
      serializer: ManualSerializer
    ).as_json(current_user: current_user)
  rescue => e
    # CollectionSerializerで問題が発生した場合は手動シリアライズにフォールバック
    Rails.logger.warn "CollectionSerializer failed, falling back to manual serialization: #{e.message}"
    paginated.map do |manual|
      ManualSerializer.new(manual, current_user: current_user).as_json
    end
  end
end
```

### ✅ ページネーション付きレスポンス
```ruby
def manuals_collection_response(manuals, paginated, message: nil)
  serialized_data = serialize_manual_collection(paginated)
  
  response_body = {
    success: true,
    data: {
      data: serialized_data,
      meta: {
        total_count: paginated.total_count,
        total_pages: paginated.total_pages,
        current_page: paginated.current_page
      }
    }
  }
  response_body[:message] = message if message.present?
  
  render json: response_body
end
```

## 非推奨パターン（修正が必要）

### ❌ TasksController現在の実装
```ruby
# 直接的なCollectionSerializer使用（エラーハンドリングなし）
render json: { 
  success: true, 
  data: ActiveModel::Serializer::CollectionSerializer.new(tasks, serializer: TaskSerializer),
  meta: { ... }
}

# 手動シリアライズ（非一貫性）
serialized_tasks = tasks.map { |task| TaskSerializer.new(task).as_json }
render json: { success: true, data: serialized_tasks }
```

## 統一すべき理由

### 1. エラーハンドリングの改善
- CollectionSerializerの失敗時に適切なフォールバック
- Rails環境やバージョン変更時の安定性向上

### 2. レスポンス形式の一貫性
```typescript
// フロントエンド期待形式
{
  success: true,
  data: {
    data: [...],      // 実際のデータ
    meta: {           // メタデータ
      total_count: number,
      total_pages: number,
      current_page: number
    }
  },
  message?: string
}
```

### 3. 保守性の向上
- 共通メソッドによるDRY原則
- デバッグ・トラブルシューティングの容易性
- 将来的な変更に対する影響範囲の最小化

## 推奨アクション

1. **TasksController のリファクタリング**
   - ManualsControllerのパターンに統一
   - 共通メソッドの抽出と再利用

2. **共通モジュール化の検討**
   - `SerializationHelpers` モジュールの作成
   - 各コントローラーでのinclude

3. **テストの追加**
   - シリアライザーエラー時のフォールバック動作確認
   - レスポンス形式の一貫性テスト

## まとめ

`ManualSerializer`の`ActiveModel::Serializer`使用は正しい選択です。問題は他のコントローラーで一貫性のないパターンが使用されていることです。ManualsControllerを参考に、他のコントローラーも統一していくことを推奨します。 
