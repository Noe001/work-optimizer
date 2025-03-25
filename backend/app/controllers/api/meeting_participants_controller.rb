module Api
  class MeetingParticipantsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_meeting
    
    # 参加者を追加
    def create
      participants = []
      errors = []
      
      # ユーザーIDの配列を処理
      params[:user_ids].each do |user_id|
        participant = @meeting.participants.build(user_id: user_id)
        
        if participant.save
          participants << participant
        else
          errors << { user_id: user_id, errors: participant.errors.full_messages }
        end
      end
      
      if errors.empty?
        render json: { success: true, data: participants, message: '参加者を追加しました' }
      else
        render json: { success: false, data: participants, errors: errors, message: '一部の参加者の追加に失敗しました' }, status: :unprocessable_entity
      end
    end
    
    # 参加者を削除
    def destroy
      participant = @meeting.meeting_participants.find_by(user_id: params[:id])
      
      if participant
        participant.destroy
        render json: { success: true, message: '参加者を削除しました' }
      else
        render json: { success: false, message: '参加者が見つかりません' }, status: :not_found
      end
    end
    
    private
    
    def set_meeting
      @meeting = Meeting.find(params[:meeting_id])
    rescue ActiveRecord::RecordNotFound
      render json: { success: false, message: 'ミーティングが見つかりません' }, status: :not_found
    end
  end
end 
