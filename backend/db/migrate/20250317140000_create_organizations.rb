class CreateOrganizations < ActiveRecord::Migration[7.2]
  def change
    create_table :organizations, id: :string do |t|
      t.string :name, null: false
      t.text :description

      t.timestamps
    end
    
    # 既存のOrganizationMembershipsマイグレーションを修正
    reversible do |dir|
      dir.up do
        # 既存のテーブルが存在する場合は削除
        drop_table :organization_memberships if table_exists?(:organization_memberships)
      end
    end
  end
end 
