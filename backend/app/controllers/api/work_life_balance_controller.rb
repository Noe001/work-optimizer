module Api
  class WorkLifeBalanceController < ApplicationController
    before_action :authenticate_user!
    
    # ワークライフバランスデータの取得
    def index
      # ダミーデータを返す
      data = {
        id: 1,
        score: 75,
        status: 'good',
        lastUpdated: Time.now.iso8601,
        recommendations: [
          "定期的に休憩を取りましょう",
          "就業時間後はメールをチェックしないようにしましょう",
          "週に3回は運動を取り入れましょう"
        ],
        stressFactors: [
          {
            factor: "長時間労働",
            level: "medium",
            recommendations: ["定時退社を心がける", "タスクの優先順位付け"]
          },
          {
            factor: "締め切りプレッシャー",
            level: "high",
            recommendations: ["計画的なスケジュール管理", "上司との率直な対話"]
          }
        ],
        wellnessIndicators: [
          {
            name: "運動",
            value: 60,
            target: 100
          },
          {
            name: "睡眠",
            value: 85,
            target: 100
          },
          {
            name: "休息",
            value: 70,
            target: 100
          },
          {
            name: "精神的健康",
            value: 75,
            target: 100
          }
        ]
      }
      
      render json: { success: true, data: data }
    end
    
    # ウェルネス指標の更新
    def update_wellness
      indicator_id = params[:id]
      value = params[:value]
      
      # 実際のアプリケーションではDBの更新が必要
      
      render json: { 
        success: true, 
        message: 'ウェルネス指標が更新されました',
        data: {
          id: indicator_id.to_i,
          name: ["運動", "睡眠", "休息", "精神的健康"][indicator_id.to_i % 4],
          value: value.to_i,
          target: 100
        }
      }
    end
    
    # 健康目標の設定
    def set_goal
      goal_data = params.permit(:category, :value, :deadline)
      
      # 実際のアプリケーションではDBの保存が必要
      
      render json: { 
        success: true, 
        message: '目標が設定されました',
        data: {
          id: rand(1..100),
          category: goal_data[:category],
          value: goal_data[:value].to_i,
          deadline: goal_data[:deadline],
          progress: 0
        }
      }
    end
    
    # バランス履歴の取得
    def get_history
      period = params[:period] || 'daily'
      
      # ダミーデータ
      history_data = case period
      when 'daily'
        Array.new(7) do |i|
          {
            date: (Date.today - i).iso8601,
            score: rand(60..90),
            work_hours: rand(6..10),
            sleep_hours: rand(6..8)
          }
        end
      when 'weekly'
        Array.new(4) do |i|
          {
            week: "Week #{i+1}",
            score: rand(60..90),
            avg_work_hours: rand(35..45),
            avg_sleep_hours: rand(6..8) * 7
          }
        end
      when 'monthly'
        Array.new(6) do |i|
          {
            month: (Date.today - i.months).strftime('%Y-%m'),
            score: rand(60..90),
            total_work_hours: rand(140..180),
            total_overtime: rand(0..20)
          }
        end
      end
      
      render json: { success: true, data: history_data }
    end
  end
end 
