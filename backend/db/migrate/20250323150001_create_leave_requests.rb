class CreateLeaveRequests < ActiveRecord::Migration[7.0]
  def change
    create_table :leave_requests do |t|
      t.string :user_id, null: false
      t.string :leave_type, null: false
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.text :reason
      t.string :status, default: 'pending', null: false

      t.timestamps
    end
    add_index :leave_requests, :user_id
    add_foreign_key :leave_requests, :users
  end
end 
