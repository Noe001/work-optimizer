class MarkMessagesAsReadJob < ApplicationJob
  queue_as :default
  
  # リトライ設定
  retry_on StandardError, wait: :exponentially_longer, attempts: 3
  
  def perform(chat_room_id, user_id)
    chat_room = ChatRoom.find(chat_room_id)
    user = User.find(user_id)
    
    # 自分以外の未読メッセージを既読にする
    unread_messages = chat_room.messages
                               .where.not(user_id: user_id)
                               .where(read: false)
                               .limit(100) # 一度に処理する件数を制限
    
    # バッチ更新で効率化
    unread_messages.update_all(
      read: true,
      read_at: Time.current,
      updated_at: Time.current
    )
    
    # キャッシュをクリア
    Rails.cache.delete("chat_room_#{chat_room_id}_unread_count_#{user_id}")
    
    Rails.logger.info "Marked #{unread_messages.count} messages as read for user #{user_id} in chat room #{chat_room_id}"
    
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error "MarkMessagesAsReadJob failed: #{e.message}"
    # レコードが見つからない場合はリトライしない
    raise ActiveJob::DeserializationError, e.message
  rescue => e
    Rails.logger.error "MarkMessagesAsReadJob failed: #{e.message}"
    raise e
  end
end 
