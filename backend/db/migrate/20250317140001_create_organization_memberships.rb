class CreateOrganizationMemberships < ActiveRecord::Migration[7.2]
  def change
    create_table :organization_memberships do |t|
      t.string :user_id, null: false
      t.string :organization_id, null: false
      t.string :role, default: 'member'

      t.timestamps
    end
    
    add_index :organization_memberships, [:user_id, :organization_id], unique: true
    add_foreign_key :organization_memberships, :users, column: :user_id, primary_key: :id
    add_foreign_key :organization_memberships, :organizations, column: :organization_id, primary_key: :id
  end
end 
