class CreateChatRoomMemberships < ActiveRecord::Migration[7.2]
  def change
    create_table :chat_room_memberships do |t|
      t.string :chat_room_id, null: false
      t.string :user_id, null: false
      t.string :role, default: 'member'

      t.timestamps
    end

    add_index :chat_room_memberships, [:chat_room_id, :user_id], unique: true
    add_index :chat_room_memberships, :user_id
    add_foreign_key :chat_room_memberships, :chat_rooms
    add_foreign_key :chat_room_memberships, :users
  end
end
