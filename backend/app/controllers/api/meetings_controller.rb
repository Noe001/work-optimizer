module Api
  class MeetingsController < ApplicationController
    before_action :authenticate_user!, except: [:index, :show]
    before_action :set_meeting, only: [:show, :update, :destroy, :add_participants, :remove_participant]

    # ミーティング一覧の取得
    def index
      meetings = Meeting.all
      render json: { success: true, data: meetings }
    end

    # 自分のミーティング一覧
    def my
      # 現在はダミーデータを返す（本来はDBから取得）
      dummy_meetings = [
        {
          id: "1",
          title: "朝会",
          scheduled_time: "2025-02-08T09:00:00",
          participants: 5,
          agenda: [
            { topic: "進捗報告", duration: 15 },
            { topic: "問題点の共有", duration: 10 },
            { topic: "今日のタスク確認", duration: 5 },
          ]
        },
        {
          id: "2",
          title: "プロジェクトMTG",
          scheduled_time: "2025-02-08T14:00:00", 
          participants: 8,
          agenda: [
            { topic: "プロジェクト概要", duration: 10 },
            { topic: "タイムライン確認", duration: 20 },
            { topic: "リスク分析", duration: 15 },
            { topic: "次のステップ", duration: 15 },
          ]
        }
      ]
      
      render json: { success: true, data: dummy_meetings }
    end

    # ミーティング詳細の取得
    def show
      render json: { success: true, data: @meeting }
    end

    # ミーティングの作成
    def create
      meeting = Meeting.new(meeting_params)
      
      if meeting.save
        render json: { success: true, data: meeting, message: 'ミーティングが作成されました' }, status: :created
      else
        render json: { success: false, errors: meeting.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # ミーティングの更新
    def update
      if @meeting.update(meeting_params)
        render json: { success: true, data: @meeting, message: 'ミーティングが更新されました' }
      else
        render json: { success: false, errors: @meeting.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # ミーティングの削除
    def destroy
      @meeting.destroy
      render json: { success: true, message: 'ミーティングが削除されました' }
    end

    # 参加者の追加
    def add_participants
      user_ids = params[:user_ids]
      
      # 本来はDBに追加処理が必要
      
      render json: { success: true, message: '参加者が追加されました' }
    end

    # 参加者の削除
    def remove_participant
      user_id = params[:user_id]
      
      # 本来はDBから削除処理が必要
      
      render json: { success: true, message: '参加者が削除されました' }
    end

    private

    def set_meeting
      @meeting = Meeting.find_by(id: params[:id])
      
      if @meeting.nil?
        render json: { success: false, message: 'ミーティングが見つかりません' }, status: :not_found
      end
    end

    def meeting_params
      params.require(:meeting).permit(:title, :agenda, :start_time, :end_time)
    end
  end
end 
