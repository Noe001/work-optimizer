class AddIndexesToChatTables < ActiveRecord::Migration[7.2]
  def change
    # メッセージ検索用インデックス
    add_index :messages, [:chat_room_id, :created_at], name: 'index_messages_on_chat_room_and_created_at'
    add_index :messages, [:user_id, :created_at], name: 'index_messages_on_user_and_created_at'
    add_index :messages, :read, name: 'index_messages_on_read'
    add_index :messages, [:chat_room_id, :read], name: 'index_messages_on_chat_room_and_read'
    
    # チャットルーム検索用インデックス
    add_index :chat_rooms, :is_direct_message, name: 'index_chat_rooms_on_is_direct_message'
    add_index :chat_rooms, :created_at, name: 'index_chat_rooms_on_created_at'
    
    # チャットルームメンバーシップ検索用インデックス
    add_index :chat_room_memberships, [:user_id, :chat_room_id], name: 'index_chat_memberships_on_user_and_room'
    add_index :chat_room_memberships, [:chat_room_id, :role], name: 'index_chat_memberships_on_room_and_role'
    add_index :chat_room_memberships, :role, name: 'index_chat_memberships_on_role'
    
    # Active Storage関連のインデックス（添付ファイル検索用）
    add_index :active_storage_attachments, [:record_type, :record_id, :name], 
              name: 'index_active_storage_attachments_on_record_and_name'
  end
end 
