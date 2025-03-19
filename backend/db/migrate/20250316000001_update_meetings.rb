class UpdateMeetings < ActiveRecord::Migration[7.2]
  def change
    create_table :meetings, id: false do |t|
      t.string :id, limit: 36, null: false, primary_key: true
      t.string :title, null: false
      t.text :agenda
      t.text :description
      t.string :location
      t.timestamp :start_time, null: false
      t.timestamp :end_time, null: false
      t.string :organizer_id, null: false

      t.timestamps
    end
    
    add_index :meetings, :organizer_id
  end
end 
