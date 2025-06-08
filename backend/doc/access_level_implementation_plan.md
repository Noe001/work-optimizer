# アクセス権限実装計画書

## 🚨 現在の仮実装問題

### 問題の概要
`access_level = 'specific'` の実装が意図と異なっている

**期待される仕様**:
- `specific`: 指定されたメンバーのみアクセス可能

**現在の実装**:
- `specific`: 作成者のみアクセス可能（`author`レベルと同等）

### 影響範囲
- `Manual.accessible_by(user)` スコープ
- `ManualsController#can_view?` メソッド  
- `ManualsController#can_edit?` メソッド
- `ManualSerializer#can_edit` メソッド

## 📋 段階的実装計画

### Phase 1: 即座対応（緊急）🚨

#### 1.1 ユーザー向け警告実装
```ruby
# Manual モデルに警告メソッド追加
def access_level_warning?
  access_specific? && Rails.env.development?
end

def access_level_warning_message
  "注意: 'specific'アクセスレベルは現在仮実装のため、作成者のみアクセス可能です"
end
```

#### 1.2 フロントエンド注意書き追加
```typescript
// アクセスレベル選択時の注意表示
const ACCESS_LEVELS: ManualAccessLevelOption[] = [
  { value: 'all', label: '全社員' },
  { value: 'department', label: '部門内' },
  { 
    value: 'specific', 
    label: '指定メンバーのみ ⚠️ 仮実装',
    description: '現在は作成者のみアクセス可能として動作します'
  },
];
```

### Phase 2: 関連テーブル設計（2週間）🔄

#### 2.1 ManualAccess テーブル設計
```ruby
class CreateManualAccesses < ActiveRecord::Migration[7.0]
  def change
    create_table :manual_accesses, id: :string do |t|
      t.string :manual_id, null: false
      t.string :user_id, null: false
      t.string :access_type, default: 'read', null: false
      t.datetime :granted_at, null: false
      t.string :granted_by_id, null: false

      t.timestamps
    end

    add_index :manual_accesses, [:manual_id, :user_id], unique: true
    add_index :manual_accesses, :user_id
    add_index :manual_accesses, :access_type
    
    add_foreign_key :manual_accesses, :manuals, column: :manual_id
    add_foreign_key :manual_accesses, :users, column: :user_id
    add_foreign_key :manual_accesses, :users, column: :granted_by_id
  end
end
```

#### 2.2 モデル関連付け
```ruby
class Manual < ApplicationRecord
  has_many :manual_accesses, dependent: :destroy
  has_many :accessible_users, through: :manual_accesses, source: :user
  
  def accessible_by_specific_users?(user)
    return false unless access_specific?
    
    # 作成者は常にアクセス可能
    return true if user_id == user.id
    
    # 明示的に許可されたユーザー
    manual_accesses.exists?(user_id: user.id, access_type: ['read', 'write'])
  end
end

class User < ApplicationRecord
  has_many :manual_accesses, dependent: :destroy
  has_many :accessible_manuals, through: :manual_accesses, source: :manual
end
```

#### 2.3 新しいaccessible_byスコープ
```ruby
scope :accessible_by, ->(user) {
  if user.nil?
    none
  else
    where(
      '(manuals.user_id = ?) OR ' +
      '(manuals.status = ? AND (' +
        'manuals.access_level = ? OR ' +
        '(manuals.access_level = ? AND manuals.department = ?) OR ' +
        '(manuals.access_level = ? AND EXISTS(' +
          'SELECT 1 FROM manual_accesses ma ' +
          'WHERE ma.manual_id = manuals.id AND ma.user_id = ?' +
        '))' +
      '))',
      user.id,           # 自分が作成したマニュアル
      'published',       # 公開済みマニュアル
      'all',            # 全社員アクセス可能
      'department', user.department.to_s,  # 部門アクセス
      'specific', user.id  # 指定ユーザーアクセス
    )
  end
}
```

### Phase 3: UIとAPI拡張（1週間）📱

#### 3.1 メンバー選択UI
```tsx
// 指定メンバー選択コンポーネント
const SpecificMembersSelector: React.FC<{
  selectedUsers: string[];
  onUsersChange: (users: string[]) => void;
}> = ({ selectedUsers, onUsersChange }) => {
  // ユーザー検索・選択機能
  // 部門メンバー表示
  // 選択済みユーザー管理
};
```

#### 3.2 アクセス権限管理API
```ruby
# POST /api/manuals/:id/accesses
def grant_access
  @access = @manual.manual_accesses.build(access_params)
  @access.granted_by = current_user
  
  if @access.save
    render json: { success: true }
  else
    render json: { success: false, errors: @access.errors }
  end
end

# DELETE /api/manuals/:id/accesses/:user_id
def revoke_access
  @access = @manual.manual_accesses.find_by(user_id: params[:user_id])
  
  if @access&.destroy
    render json: { success: true }
  else
    render json: { success: false }
  end
end
```

### Phase 4: 高度な権限管理（将来計画）🚀

#### 4.1 ロールベースアクセス制御
```ruby
class Role < ApplicationRecord
  has_many :user_roles, dependent: :destroy
  has_many :users, through: :user_roles
  
  enum scope: {
    global: 'global',
    department: 'department', 
    manual: 'manual'
  }
end

class UserRole < ApplicationRecord
  belongs_to :user
  belongs_to :role
  belongs_to :resource, polymorphic: true, optional: true
end
```

#### 4.2 権限継承システム
```ruby
# 部門管理者 → 部門メンバーへの権限継承
# チームリーダー → チームメンバーへの権限継承
# プロジェクト管理者 → プロジェクトメンバーへの権限継承
```

## ⚠️ 移行時の注意事項

### データ整合性
- 既存の`specific`アクセスレベルマニュアルの扱い
- 現在の作成者権限の保持
- 段階的移行による影響最小化

### パフォーマンス考慮
- `manual_accesses`テーブルのインデックス最適化
- N+1クエリ対策
- キャッシュ戦略

### セキュリティ
- 権限昇格の防止
- 監査ログの実装
- 不正アクセスの検出

## 📅 実装スケジュール

| Phase | 期間 | 優先度 | 担当 |
|-------|------|--------|------|
| Phase 1 | 即日 | 🔴 緊急 | フルスタック |
| Phase 2 | 2週間 | 🟡 高 | バックエンド |
| Phase 3 | 1週間 | 🟡 高 | フロントエンド | 
| Phase 4 | 1ヶ月 | 🟢 中 | フルスタック |

## 🧪 テスト戦略

### Unit Tests
- ManualAccess モデルテスト
- accessible_by スコープテスト
- 権限チェックメソッドテスト

### Integration Tests
- API権限テスト
- UIアクセス制御テスト
- 権限継承テスト

### Security Tests
- 権限昇格テスト
- 不正アクセステスト
- SQLインジェクション対策テスト 
