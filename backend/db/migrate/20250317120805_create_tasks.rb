class CreateTasks < ActiveRecord::Migration[7.2]
  def change
    create_table :tasks, id: :string do |t|
      t.string :title, null: false
      t.text :description
      t.date :due_date
      t.string :status, default: 'pending'
      t.string :priority, default: 'medium'
      t.string :assigned_to
      t.string :tags
      t.string :organization_id

      t.timestamps
    end
    
    add_index :tasks, :assigned_to
    add_index :tasks, :organization_id
  end
end 
