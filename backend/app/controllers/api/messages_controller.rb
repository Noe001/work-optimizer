module Api
  class MessagesController < ApplicationController
    before_action :authenticate_user!
    before_action :set_chat_room
    before_action :check_membership
    before_action :set_message, only: [:show, :update, :destroy]
    
    # GET /api/chat_rooms/:chat_room_id/messages
    # メッセージ履歴の取得
    def index
      # ページネーション用のパラメータ
      page = params[:page] || 1
      per_page = params[:per_page] || 20
      
      # メッセージを取得（新しい順）
      @messages = @chat_room.messages.includes(:user)
                            .order(created_at: :desc)
                            .page(page).per(per_page)
      
      # 未読メッセージを既読にする
      @messages.each do |message|
        message.mark_as_read(current_user) if message.user_id != current_user.id
      end
      
      render json: {
        success: true,
        data: @messages.as_json(include: { user: { only: [:id, :name] } }),
        pagination: {
          current_page: @messages.current_page,
          total_pages: @messages.total_pages,
          total_count: @messages.total_count
        }
      }
    end
    
    # GET /api/chat_rooms/:chat_room_id/messages/:id
    # 特定のメッセージ詳細を取得
    def show
      render json: {
        success: true,
        data: @message.as_json(include: { user: { only: [:id, :name] } })
      }
    end
    
    # POST /api/chat_rooms/:chat_room_id/messages
    # 新しいメッセージを作成
    def create
      @message = current_user.messages.build(message_params)
      @message.chat_room = @chat_room
      
      # 添付ファイルの処理
      if params[:attachment].present?
        @message.attachment.attach(
          io: params[:attachment],
          filename: params[:attachment].original_filename,
          content_type: params[:attachment].content_type
        )
      end
      
      if @message.save
        # Action Cableでメッセージをブロードキャスト
        ActionCable.server.broadcast(
          "chat_room_#{@chat_room.id}",
          message: @message.as_json(include: { user: { only: [:id, :name] } }),
          user: current_user.as_json(only: [:id, :name])
        )
        
        render json: {
          success: true,
          data: @message.as_json(include: { user: { only: [:id, :name] } })
        }, status: :created
      else
        render json: {
          success: false,
          message: @message.errors.full_messages.join(', ')
        }, status: :unprocessable_entity
      end
    end
    
    # PUT /api/chat_rooms/:chat_room_id/messages/:id
    # メッセージの更新（自分のメッセージのみ）
    def update
      # 自分のメッセージかチェック
      unless @message.user_id == current_user.id
        return render json: {
          success: false,
          message: '他のユーザーのメッセージは編集できません'
        }, status: :forbidden
      end
      
      if @message.update(message_params)
        # 更新をブロードキャスト
        ActionCable.server.broadcast(
          "chat_room_#{@chat_room.id}",
          message_updated: @message.as_json(include: { user: { only: [:id, :name] } }),
          user: current_user.as_json(only: [:id, :name])
        )
        
        render json: {
          success: true,
          data: @message.as_json(include: { user: { only: [:id, :name] } })
        }
      else
        render json: {
          success: false,
          message: @message.errors.full_messages.join(', ')
        }, status: :unprocessable_entity
      end
    end
    
    # DELETE /api/chat_rooms/:chat_room_id/messages/:id
    # メッセージの削除（自分のメッセージのみ）
    def destroy
      # 自分のメッセージかチェック
      unless @message.user_id == current_user.id
        return render json: {
          success: false,
          message: '他のユーザーのメッセージは削除できません'
        }, status: :forbidden
      end
      
      @message.destroy
      
      # 削除をブロードキャスト
      ActionCable.server.broadcast(
        "chat_room_#{@chat_room.id}",
        message_deleted: { id: @message.id },
        user: current_user.as_json(only: [:id, :name])
      )
      
      render json: {
        success: true,
        message: 'メッセージが削除されました'
      }
    end
    
    # POST /api/chat_rooms/:chat_room_id/messages/read_all
    # すべてのメッセージを既読にする
    def read_all
      @chat_room.messages.where.not(user_id: current_user.id).each do |message|
        message.mark_as_read(current_user)
      end
      
      render json: {
        success: true,
        message: 'すべてのメッセージが既読になりました'
      }
    end
    
    private
    
    def set_chat_room
      @chat_room = ChatRoom.find(params[:chat_room_id])
    rescue ActiveRecord::RecordNotFound
      render json: {
        success: false,
        message: 'チャットルームが見つかりません'
      }, status: :not_found
    end
    
    def check_membership
      unless @chat_room.users.include?(current_user)
        render json: {
          success: false,
          message: 'このチャットルームにアクセスする権限がありません'
        }, status: :forbidden
      end
    end
    
    def set_message
      @message = @chat_room.messages.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: {
        success: false,
        message: 'メッセージが見つかりません'
      }, status: :not_found
    end
    
    def message_params
      params.require(:message).permit(:content)
    end
  end
end
