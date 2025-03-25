class CreateMeetingParticipants < ActiveRecord::Migration[7.2]
  def change
    create_table :meeting_participants do |t|
      t.string :meeting_id, null: false
      t.string :user_id, null: false

      t.timestamps
    end
    
    add_index :meeting_participants, [:meeting_id, :user_id], unique: true
    add_index :meeting_participants, :user_id
  end
end 
