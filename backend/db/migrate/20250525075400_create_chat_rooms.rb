class CreateChatRooms < ActiveRecord::Migration[7.2]
  def change
    create_table :chat_rooms, id: :string do |t|
      t.string :name
      t.boolean :is_direct_message, default: false
      
      t.timestamps
    end
  end
end
