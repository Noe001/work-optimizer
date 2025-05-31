class AddFieldsToManuals < ActiveRecord::Migration[7.2]
  def change
    add_column :manuals, :user_id, :string
    add_column :manuals, :department, :string
    add_column :manuals, :category, :string
    add_column :manuals, :access_level, :string, default: 'all'
    add_column :manuals, :edit_permission, :string, default: 'author'
    add_column :manuals, :status, :string, default: 'draft'
    add_column :manuals, :tags, :text

    add_index :manuals, :user_id
    add_index :manuals, :department
    add_index :manuals, :category
    add_index :manuals, :status
  end
end
