class CreateMeetings < ActiveRecord::Migration[7.2]
  def change
    create_table :meetings, id: false do |t|
      t.string :id, limit: 36, null: false, primary_key: true
      t.text :agenda
      t.timestamp :start_time
      t.timestamp :end_time

      t.timestamps
    end
  end
end
