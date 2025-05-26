class ChatChannel < ApplicationCable::Channel
  # チャンネル購読時の処理
  def subscribed
    chat_room_id = params[:chat_room_id]
    
    # パラメータ検証
    unless chat_room_id.present?
      Rails.logger.warn "Chat channel subscription failed: missing chat_room_id for user #{current_user.id}"
      reject
      return
    end
    
    # チャットルームの存在確認
    @chat_room = ChatRoom.find_by(id: chat_room_id)
    unless @chat_room
      Rails.logger.warn "Chat channel subscription failed: chat room #{chat_room_id} not found for user #{current_user.id}"
      reject
      return
    end
    
    # アクセス権限確認
    unless @chat_room.accessible_by?(current_user)
      Rails.logger.warn "Chat channel subscription failed: user #{current_user.id} has no access to chat room #{chat_room_id}"
      reject
      return
    end
    
    # ストリーム開始
    stream_from "chat_room_#{@chat_room.id}"
    
    # 購読成功をログに記録
    Rails.logger.info "User #{current_user.id} subscribed to chat room #{@chat_room.id}"
    
    # オンライン状態を更新
    update_online_status(true)
    
    # 他のユーザーに参加を通知
    broadcast_user_status('joined')
    
  rescue => e
    Rails.logger.error "Chat channel subscription error: #{e.message} for user #{current_user.id}"
    reject
  end
  
  # チャンネル購読解除時の処理
  def unsubscribed
    if @chat_room
      Rails.logger.info "User #{current_user.id} unsubscribed from chat room #{@chat_room.id}"
      
      # オンライン状態を更新
      update_online_status(false)
      
      # 他のユーザーに退出を通知
      broadcast_user_status('left')
    end
  end
  
  # メッセージ送信処理
  def send_message(data)
    return unless @chat_room&.accessible_by?(current_user)
    
    # レート制限チェック
    return if rate_limited?
    
    # データ検証
    content = data['content']&.strip
    return if content.blank? || content.length > 2000
    
    begin
      # メッセージ作成
      message = current_user.messages.build(
        content: content,
        chat_room: @chat_room
      )
      
      if message.save
        # メッセージをブロードキャスト
        ActionCable.server.broadcast(
          "chat_room_#{@chat_room.id}",
          {
            type: 'new_message',
            message: message.as_json(include: { user: { only: [:id, :name] } }),
            user: current_user.as_json(only: [:id, :name]),
            timestamp: Time.current.iso8601
          }
        )
        
        # キャッシュをクリア
        clear_chat_room_cache
        
        Rails.logger.info "Message sent by user #{current_user.id} in chat room #{@chat_room.id}"
      else
        # エラーを送信者にのみ通知
        transmit({
          type: 'error',
          message: 'メッセージの送信に失敗しました',
          errors: message.errors.full_messages
        })
      end
      
    rescue => e
      Rails.logger.error "Message sending error: #{e.message} for user #{current_user.id}"
      transmit({
        type: 'error',
        message: 'サーバーエラーが発生しました'
      })
    end
  end
  
  # タイピング状態の通知
  def typing(data)
    return unless @chat_room&.accessible_by?(current_user)
    
    # タイピング状態をブロードキャスト（送信者以外に）
    ActionCable.server.broadcast(
      "chat_room_#{@chat_room.id}",
      {
        type: 'typing',
        user: current_user.as_json(only: [:id, :name]),
        is_typing: data['is_typing'],
        timestamp: Time.current.iso8601
      }
    )
  end
  
  # メッセージ既読通知
  def mark_as_read(data)
    return unless @chat_room&.accessible_by?(current_user)
    
    message_id = data['message_id']
    return unless message_id.present?
    
    begin
      message = @chat_room.messages.find(message_id)
      
      # 自分のメッセージでない場合のみ既読にする
      if message.user_id != current_user.id
        message.mark_as_read(current_user)
        
        # 既読通知をブロードキャスト
        ActionCable.server.broadcast(
          "chat_room_#{@chat_room.id}",
          {
            type: 'message_read',
            message_id: message.id,
            user: current_user.as_json(only: [:id, :name]),
            timestamp: Time.current.iso8601
          }
        )
      end
      
    rescue ActiveRecord::RecordNotFound
      transmit({
        type: 'error',
        message: 'メッセージが見つかりません'
      })
    rescue => e
      Rails.logger.error "Mark as read error: #{e.message} for user #{current_user.id}"
      transmit({
        type: 'error',
        message: 'エラーが発生しました'
      })
    end
  end
  
  private
  
  # レート制限チェック
  def rate_limited?
    key = "chat_rate_limit:#{current_user.id}:#{@chat_room.id}"
    count = Rails.cache.read(key) || 0
    
    if count >= 10 # 1分間に10メッセージまで
      transmit({
        type: 'error',
        message: 'メッセージ送信が制限されています。しばらくお待ちください。',
        error_code: 'RATE_LIMIT_EXCEEDED'
      })
      return true
    end
    
    Rails.cache.write(key, count + 1, expires_in: 1.minute)
    false
  end
  
  # オンライン状態更新
  def update_online_status(online)
    key = "chat_room_#{@chat_room.id}_user_#{current_user.id}_online"
    
    if online
      Rails.cache.write(key, true, expires_in: 5.minutes)
    else
      Rails.cache.delete(key)
    end
  end
  
  # ユーザー状態をブロードキャスト
  def broadcast_user_status(status)
    ActionCable.server.broadcast(
      "chat_room_#{@chat_room.id}",
      {
        type: 'user_status',
        user: current_user.as_json(only: [:id, :name]),
        status: status,
        timestamp: Time.current.iso8601
      }
    )
  end
  
  # チャットルームキャッシュクリア
  def clear_chat_room_cache
    Rails.cache.delete("chat_room_#{@chat_room.id}_last_message")
    Rails.cache.delete_matched("chat_room_#{@chat_room.id}_unread_count_*")
  end
end
