class UpdateMeetings < ActiveRecord::Migration[7.2]
  def change
    # 既存のテーブルを削除して新しく作成する
    drop_table :meetings
    
    create_table :meetings, id: :string do |t|
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
