module Api
  class ChatRoomsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_chat_room, only: [:show, :update, :destroy]
    before_action :check_membership, only: [:show, :update, :destroy]
    
    # GET /api/chat_rooms
    # チャットルーム一覧の取得
    def index
      # ユーザーが参加しているチャットルームを取得
      @chat_rooms = current_user.chat_rooms
      
      # ダイレクトメッセージとグループチャットを分ける
      direct_messages = @chat_rooms.direct_messages
      group_chats = @chat_rooms.group_chats
      
      render json: {
        success: true,
        data: {
          direct_messages: direct_messages.as_json(include: { users: { only: [:id, :name] } }),
          channels: group_chats.as_json(include: { users: { only: [:id, :name] } })
        }
      }
    end
    
    # GET /api/chat_rooms/:id
    # 特定のチャットルーム詳細を取得
    def show
      render json: {
        success: true,
        data: @chat_room.as_json(include: { users: { only: [:id, :name] } })
      }
    end
    
    # POST /api/chat_rooms
    # 新しいチャットルームを作成
    def create
      ActiveRecord::Base.transaction do
        # ダイレクトメッセージの場合
        if chat_room_params[:is_direct_message] && params[:user_ids].present?
          user_ids = [current_user.id, params[:user_ids].first]
          @chat_room = ChatRoom.direct_message_for_users(user_ids)
        else
          # グループチャットの場合
          @chat_room = ChatRoom.new(chat_room_params)
          @chat_room.save!
          
          # 作成者を管理者として追加
          ChatRoomMembership.create!(
            chat_room: @chat_room,
            user: current_user,
            role: 'admin'
          )
          
          # 他のメンバーを追加
          if params[:user_ids].present?
            params[:user_ids].each do |user_id|
              next if user_id == current_user.id
              ChatRoomMembership.create!(
                chat_room: @chat_room,
                user_id: user_id,
                role: 'member'
              )
            end
          end
        end
        
        render json: {
          success: true,
          data: @chat_room.as_json(include: { users: { only: [:id, :name] } })
        }, status: :created
      end
    rescue ActiveRecord::RecordInvalid => e
      render json: {
        success: false,
        message: e.message
      }, status: :unprocessable_entity
    end
    
    # PUT /api/chat_rooms/:id
    # チャットルームの更新
    def update
      # 管理者権限チェック
      membership = ChatRoomMembership.find_by(chat_room: @chat_room, user: current_user)
      
      unless membership&.admin?
        return render json: {
          success: false,
          message: 'チャットルームの管理者権限がありません'
        }, status: :forbidden
      end
      
      if @chat_room.update(chat_room_params)
        render json: {
          success: true,
          data: @chat_room.as_json(include: { users: { only: [:id, :name] } })
        }
      else
        render json: {
          success: false,
          message: @chat_room.errors.full_messages.join(', ')
        }, status: :unprocessable_entity
      end
    end
    
    # DELETE /api/chat_rooms/:id
    # チャットルームの削除
    def destroy
      # 管理者権限チェック
      membership = ChatRoomMembership.find_by(chat_room: @chat_room, user: current_user)
      
      unless membership&.admin?
        return render json: {
          success: false,
          message: 'チャットルームの管理者権限がありません'
        }, status: :forbidden
      end
      
      @chat_room.destroy
      
      render json: {
        success: true,
        message: 'チャットルームが削除されました'
      }
    end
    
    # POST /api/chat_rooms/:id/add_member
    # チャットルームにメンバーを追加
    def add_member
      # 管理者権限チェック
      membership = ChatRoomMembership.find_by(chat_room: @chat_room, user: current_user)
      
      unless membership&.admin?
        return render json: {
          success: false,
          message: 'チャットルームの管理者権限がありません'
        }, status: :forbidden
      end
      
      # ダイレクトメッセージには追加できない
      if @chat_room.is_direct_message
        return render json: {
          success: false,
          message: 'ダイレクトメッセージにはメンバーを追加できません'
        }, status: :unprocessable_entity
      end
      
      # メンバー追加
      begin
        user = User.find(params[:user_id])
        
        # 既にメンバーの場合はスキップ
        if @chat_room.users.include?(user)
          return render json: {
            success: false,
            message: 'ユーザーは既にチャットルームのメンバーです'
          }, status: :unprocessable_entity
        end
        
        ChatRoomMembership.create!(
          chat_room: @chat_room,
          user: user,
          role: params[:role] || 'member'
        )
        
        render json: {
          success: true,
          message: 'メンバーが追加されました',
          data: user.as_json(only: [:id, :name])
        }
      rescue ActiveRecord::RecordNotFound
        render json: {
          success: false,
          message: 'ユーザーが見つかりません'
        }, status: :not_found
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          success: false,
          message: e.message
        }, status: :unprocessable_entity
      end
    end
    
    # DELETE /api/chat_rooms/:id/remove_member/:user_id
    # チャットルームからメンバーを削除
    def remove_member
      # 管理者権限チェック
      membership = ChatRoomMembership.find_by(chat_room: @chat_room, user: current_user)
      
      unless membership&.admin?
        return render json: {
          success: false,
          message: 'チャットルームの管理者権限がありません'
        }, status: :forbidden
      end
      
      # ダイレクトメッセージからは削除できない
      if @chat_room.is_direct_message
        return render json: {
          success: false,
          message: 'ダイレクトメッセージからはメンバーを削除できません'
        }, status: :unprocessable_entity
      end
      
      # メンバー削除
      begin
        user = User.find(params[:user_id])
        
        # 自分自身は削除できない
        if user.id == current_user.id
          return render json: {
            success: false,
            message: '自分自身をチャットルームから削除することはできません'
          }, status: :unprocessable_entity
        end
        
        membership = ChatRoomMembership.find_by(chat_room: @chat_room, user: user)
        
        if membership.nil?
          return render json: {
            success: false,
            message: 'ユーザーはチャットルームのメンバーではありません'
          }, status: :not_found
        end
        
        membership.destroy
        
        render json: {
          success: true,
          message: 'メンバーが削除されました'
        }
      rescue ActiveRecord::RecordNotFound
        render json: {
          success: false,
          message: 'ユーザーが見つかりません'
        }, status: :not_found
      end
    end
    
    private
    
    def set_chat_room
      @chat_room = ChatRoom.find(params[:id])
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
    
    def chat_room_params
      params.require(:chat_room).permit(:name, :is_direct_message)
    end
  end
end
