module Api
  class MessagesController < ApplicationController
    before_action :authenticate_user!
    before_action :set_chat_room
    before_action :check_membership
    before_action :set_message, only: [:show, :update, :destroy]
    before_action :check_rate_limit, only: [:create]
    
    # 統一されたエラーハンドリング
    rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
    rescue_from StandardError, with: :internal_server_error
    
    # GET /api/chat_rooms/:chat_room_id/messages
    # メッセージ履歴の取得
    def index
      # ページネーション用のパラメータ
      page = params[:page] || 1
      per_page = [params[:per_page].to_i, 50].min.positive? ? [params[:per_page].to_i, 50].min : 20
      
      # メッセージを取得（新しい順）- N+1クエリ解決
      @messages = @chat_room.messages
                            .includes(:user, attachment_attachment: :blob)
                            .order(created_at: :desc)
                            .page(page).per(per_page)
      
      # 未読メッセージを既読にする（バックグラウンドで処理）
      mark_messages_as_read_async
      
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
          {
            message: @message.as_json(include: { user: { only: [:id, :name] } }),
            user: current_user.as_json(only: [:id, :name])
          }
        )
        
        render json: {
          success: true,
          data: @message.as_json(include: { user: { only: [:id, :name] } })
        }, status: :created
      else
        render json: {
          success: false,
          message: @message.errors.full_messages.join(', '),
          errors: @message.errors.full_messages
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
      
      # メッセージが作成から5分以内かチェック
      if @message.created_at < 5.minutes.ago
        return render json: {
          success: false,
          message: 'メッセージの編集期限を過ぎています'
        }, status: :forbidden
      end
      
      if @message.update(message_params)
        # 更新をブロードキャスト
        ActionCable.server.broadcast(
          "chat_room_#{@chat_room.id}",
          {
            message_updated: @message.as_json(include: { user: { only: [:id, :name] } }),
            user: current_user.as_json(only: [:id, :name])
          }
        )
        
        render json: {
          success: true,
          data: @message.as_json(include: { user: { only: [:id, :name] } })
        }
      else
        render json: {
          success: false,
          message: @message.errors.full_messages.join(', '),
          errors: @message.errors.full_messages
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
        {
          message_deleted: { id: @message.id },
          user: current_user.as_json(only: [:id, :name])
        }
      )
      
      render json: {
        success: true,
        message: 'メッセージが削除されました'
      }
    end
    
    # POST /api/chat_rooms/:chat_room_id/messages/read_all
    # すべてのメッセージを既読にする
    def read_all
      @chat_room.messages.where.not(user_id: current_user.id).where(read: false).each do |message|
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
    
    # レート制限チェック
    def check_rate_limit
      key = "message_rate_limit:#{current_user.id}"
      count = Rails.cache.read(key) || 0
      
      if count >= 30 # 1分間に30メッセージまで
        render json: { 
          success: false, 
          message: 'メッセージ送信が制限されています。しばらくお待ちください。',
          error_code: 'RATE_LIMIT_EXCEEDED'
        }, status: :too_many_requests
        return
      end
      
      Rails.cache.write(key, count + 1, expires_in: 1.minute)
    end
    
    # 未読メッセージを非同期で既読にする
    def mark_messages_as_read_async
      MarkMessagesAsReadJob.perform_later(@chat_room.id, current_user.id)
    end
    
    # エラーハンドリング
    def record_not_found(exception)
      render json: {
        success: false,
        error_code: 'RECORD_NOT_FOUND',
        message: exception.message,
        timestamp: Time.current.iso8601
      }, status: :not_found
    end
    
    def record_invalid(exception)
      render json: {
        success: false,
        error_code: 'VALIDATION_ERROR',
        message: exception.message,
        errors: exception.record.errors.full_messages,
        timestamp: Time.current.iso8601
      }, status: :unprocessable_entity
    end
    
    def internal_server_error(exception)
      Rails.logger.error "Internal server error in MessagesController: #{exception.message}"
      Rails.logger.error exception.backtrace.join("\n")
      
      render json: {
        success: false,
        error_code: 'INTERNAL_SERVER_ERROR',
        message: 'サーバー内部エラーが発生しました',
        timestamp: Time.current.iso8601
      }, status: :internal_server_error
    end
  end
end
