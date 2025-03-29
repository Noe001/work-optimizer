class AddParentIdToTasks < ActiveRecord::Migration[7.2]
  def change
    add_column :tasks, :parent_task_id, :string
    add_index :tasks, :parent_task_id
  end
end
