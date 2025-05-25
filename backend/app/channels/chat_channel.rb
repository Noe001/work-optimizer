class ChatChannel < ApplicationCable::Channel
  def subscribed
    # チャットルームが存在し、ユーザーがメンバーであることを確認
    chat_room = ChatRoom.find_by(id: params[:chat_room_id])
    
    if chat_room && chat_room.users.include?(current_user)
      stream_from "chat_room_#{params[:chat_room_id]}"
    else
      reject
    end
  end

  def unsubscribed
    # クライアントが切断したときの処理
    stop_all_streams
  end

  def receive(data)
    # クライアントからのメッセージを受信して処理
    chat_room = ChatRoom.find_by(id: params[:chat_room_id])
    
    return unless chat_room && chat_room.users.include?(current_user)
    
    # メッセージを作成
    message = current_user.messages.build(
      chat_room: chat_room,
      content: data['content']
    )
    
    # 添付ファイルがある場合は処理
    if data['attachment_signed_id'].present?
      message.attachment.attach(data['attachment_signed_id'])
    end
    
    if message.save
      # メッセージをブロードキャスト
      ActionCable.server.broadcast(
        "chat_room_#{chat_room.id}",
        message: message.as_json(include: :user),
        user: current_user.as_json(only: [:id, :name])
      )
    end
  end
  
  # 入力中ステータスの送信
  def typing
    chat_room = ChatRoom.find_by(id: params[:chat_room_id])
    
    return unless chat_room && chat_room.users.include?(current_user)
    
    ActionCable.server.broadcast(
      "chat_room_#{chat_room.id}",
      typing: {
        user_id: current_user.id,
        user_name: current_user.name
      }
    )
  end
end
