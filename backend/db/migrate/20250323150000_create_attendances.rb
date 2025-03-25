class CreateAttendances < ActiveRecord::Migration[7.0]
  def change
    create_table :attendances do |t|
      t.string :user_id, null: false
      t.date :date, null: false
      t.time :check_in
      t.time :check_out
      t.float :total_hours
      t.float :overtime_hours
      t.string :status, default: 'pending', null: false
      t.text :comment

      t.timestamps
    end
    add_index :attendances, [:user_id, :date], unique: true
    add_foreign_key :attendances, :users
  end
end 
