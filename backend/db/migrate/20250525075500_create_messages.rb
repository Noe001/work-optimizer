class CreateMessages < ActiveRecord::Migration[7.2]
  def change
    create_table :messages, id: :string do |t|
      t.text :content
      t.string :chat_room_id, null: false
      t.string :user_id, null: false
      t.boolean :read, default: false
      t.datetime :read_at

      t.timestamps
    end

    add_index :messages, :chat_room_id
    add_index :messages, :user_id
    add_foreign_key :messages, :chat_rooms
    add_foreign_key :messages, :users
  end
end
