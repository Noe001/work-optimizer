class CreateManuals < ActiveRecord::Migration[7.2]
  def change
    create_table :manuals, id: :string do |t|
      t.string :title, null: false
      t.text :content
      t.string :user_id, null: false
      t.string :department, null: false
      t.string :category, null: false
      t.string :access_level, default: 'all', null: false
      t.string :edit_permission, default: 'author', null: false
      t.string :status, default: 'draft', null: false
      t.text :tags

      t.timestamps
    end

    add_index :manuals, :user_id
    add_index :manuals, :department
    add_index :manuals, :category
    add_index :manuals, :status
    add_foreign_key :manuals, :users, column: :user_id
  end
end
