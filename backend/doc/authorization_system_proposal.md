# 権限管理システム改善提案

## 現在の問題点

現在の`department_admin?`メソッドは以下の問題を抱えています：

```ruby
def department_admin?
  role.in?(['admin', 'manager']) || position&.downcase&.include?('manager')
end
```

### 問題点
1. **文字列依存**: position文字列の部分一致に依存
2. **曖昧性**: 「manager」を含む職位が全て管理者扱い
3. **拡張性の欠如**: 新しい権限の追加が困難
4. **保守性の問題**: 権限ロジックが散在

## 改善提案

### オプション1: 専用フラグの追加（簡単な改善）

```ruby
# マイグレーション
class AddDepartmentAdminToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :department_admin, :boolean, default: false
    add_index :users, :department_admin
  end
end

# モデル
def department_admin?
  department_admin || role.in?(['admin', 'super_admin'])
end
```

### オプション2: Role-Based Access Control (RBAC)

```ruby
# roles テーブル
class CreateRoles < ActiveRecord::Migration[7.0]
  def change
    create_table :roles, id: :uuid do |t|
      t.string :name, null: false
      t.string :resource_type
      t.uuid :resource_id
      t.timestamps
    end
    
    add_index :roles, [:name, :resource_type, :resource_id]
  end
end

# user_roles テーブル
class CreateUserRoles < ActiveRecord::Migration[7.0]
  def change
    create_table :user_roles, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :role, null: false, foreign_key: true, type: :uuid
      t.timestamps
    end
    
    add_index :user_roles, [:user_id, :role_id], unique: true
  end
end

# モデル実装
class User < ApplicationRecord
  has_many :user_roles, dependent: :destroy
  has_many :roles, through: :user_roles
  
  def has_role?(role_name, resource = nil)
    roles.where(name: role_name, resource: resource).exists?
  end
  
  def department_admin?
    has_role?(:department_admin, department) || 
    has_role?(:admin) || 
    has_role?(:super_admin)
  end
end
```

### オプション3: CanCanCan認可ライブラリの導入

```ruby
# Gemfile
gem 'cancancan'

# app/models/ability.rb
class Ability
  include CanCan::Ability

  def initialize(user)
    user ||= User.new # guest user

    if user.super_admin?
      can :manage, :all
    elsif user.department_admin?
      can :manage, Manual, department: user.department
      can :read, Manual, access_level: ['all', 'department']
    else
      can :read, Manual, access_level: 'all'
      can :manage, Manual, user: user
    end
  end
end

# コントローラーでの使用
class Api::ManualsController < ApplicationController
  authorize_resource
  
  def index
    @manuals = Manual.accessible_by(current_ability)
  end
end
```

### オプション4: Pundit認可ライブラリの導入

```ruby
# Gemfile
gem 'pundit'

# app/policies/manual_policy.rb
class ManualPolicy < ApplicationPolicy
  def index?
    true
  end
  
  def show?
    record.accessible_by?(user)
  end
  
  def create?
    user.present?
  end
  
  def update?
    record.editable_by?(user)
  end
  
  def destroy?
    user.admin? || user.department_admin_for?(record.department) || record.user == user
  end
  
  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.department_admin?
        scope.where(department: user.department)
      else
        scope.accessible_by(user)
      end
    end
  end
end

# コントローラーでの使用
class Api::ManualsController < ApplicationController
  include Pundit::Authorization
  
  def index
    @manuals = policy_scope(Manual)
  end
  
  def show
    authorize @manual
  end
end
```

## 推奨アプローチ

### 段階的実装
1. **短期**: 専用フラグ（department_admin）の追加
2. **中期**: 基本的なRBACシステムの実装
3. **長期**: CanCanCanまたはPunditの導入

### 実装順序
1. マイグレーションでフラグ追加
2. シードデータで既存ユーザーのフラグ設定
3. 権限チェックロジックの更新
4. テストの作成と実行

## 実装例（推奨）

```ruby
# 1. マイグレーション
class AddAuthorizationFieldsToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :department_admin, :boolean, default: false
    add_column :users, :system_admin, :boolean, default: false
    
    add_index :users, :department_admin
    add_index :users, :system_admin
  end
end

# 2. モデル更新
class User < ApplicationRecord
  def department_admin?
    department_admin || system_admin?
  end
  
  def system_admin?
    system_admin || role == 'super_admin'
  end
  
  def can_edit_manual?(manual)
    return true if system_admin?
    return true if manual.user == self
    return true if department_admin? && manual.department == department
    
    manual.edit_permission_allows?(self)
  end
  
  def can_view_manual?(manual)
    return true if system_admin?
    return true if manual.user == self
    return true if manual.published? && manual.access_level_allows?(self)
    
    false
  end
end
```

この段階的なアプローチにより、既存システムを壊すことなく、より堅牢な権限管理システムに移行できます。 
