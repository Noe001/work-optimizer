class CreateMeetings < ActiveRecord::Migration[7.2]
  def change
    create_table :meetings, id: :string do |t|
      t.text :agenda
      t.timestamp :start_time
      t.timestamp :end_time

      t.timestamps
    end
  end
end
