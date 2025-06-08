class AddAuthorizationFieldsToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :department_admin, :boolean, default: false, null: false
    add_column :users, :system_admin, :boolean, default: false, null: false  
    add_column :users, :organization_admin, :boolean, default: false, null: false
    
    # パフォーマンス向上のためのインデックス
    add_index :users, :department_admin
    add_index :users, :system_admin
    add_index :users, :organization_admin
    
    # 既存データの移行（必要に応じて）
    reversible do |dir|
      dir.up do
        # 既存の 'admin' ロールを持つユーザーをsystem_adminに設定
        execute <<-SQL
          UPDATE users 
          SET system_admin = true 
          WHERE role = 'admin'
        SQL
        
        # 既存の 'manager' ロールを持つユーザーをdepartment_adminに設定  
        execute <<-SQL
          UPDATE users 
          SET department_admin = true 
          WHERE role = 'manager'
        SQL
      end
    end
  end
end 
