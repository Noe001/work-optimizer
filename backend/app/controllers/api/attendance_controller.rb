module Api
  class AttendanceController < ApplicationController
    before_action :authenticate_user!
    
    # 勤怠データの取得
    def index
      # ダミーデータを返す
      data = {
        id: 1,
        user_id: current_user.id,
        date: Date.today.iso8601,
        check_in: "09:00:00",
        check_out: "18:00:00",
        total_hours: 8,
        overtime_hours: 0,
        status: "present",
        created_at: Time.now.iso8601,
        updated_at: Time.now.iso8601
      }
      
      render json: { success: true, data: data }
    end
    
    # 出勤打刻
    def check_in
      # 実際のアプリケーションではDBの更新が必要
      
      render json: { 
        success: true, 
        message: '出勤を記録しました',
        data: {
          id: rand(1..100),
          user_id: current_user.id,
          date: Date.today.iso8601,
          check_in: Time.now.strftime("%H:%M:%S"),
          check_out: nil,
          total_hours: nil,
          overtime_hours: nil,
          status: "present",
          created_at: Time.now.iso8601,
          updated_at: Time.now.iso8601
        }
      }
    end
    
    # 退勤打刻
    def check_out
      # 実際のアプリケーションではDBの更新が必要
      check_in_time = "09:00:00"
      check_out_time = Time.now.strftime("%H:%M:%S")
      
      # 勤務時間計算の簡略化（実際にはもっと精緻に計算する必要あり）
      check_in_seconds = Time.parse(check_in_time).seconds_since_midnight
      check_out_seconds = Time.parse(check_out_time).seconds_since_midnight
      total_seconds = check_out_seconds - check_in_seconds
      total_hours = (total_seconds / 3600.0).round(2)
      overtime_hours = [total_hours - 8, 0].max.round(2)
      
      render json: { 
        success: true, 
        message: '退勤を記録しました',
        data: {
          id: rand(1..100),
          user_id: current_user.id,
          date: Date.today.iso8601,
          check_in: check_in_time,
          check_out: check_out_time,
          total_hours: total_hours,
          overtime_hours: overtime_hours,
          status: "present",
          created_at: Time.now.iso8601,
          updated_at: Time.now.iso8601
        }
      }
    end
    
    # 休暇申請
    def request_leave
      leave_data = params.permit(:type, :start_date, :end_date, :reason)
      
      # 実際のアプリケーションではDBの保存が必要
      
      render json: { 
        success: true, 
        message: '休暇申請が送信されました',
        data: {
          id: rand(1..100),
          user_id: current_user.id,
          type: leave_data[:type],
          start_date: leave_data[:start_date],
          end_date: leave_data[:end_date],
          reason: leave_data[:reason],
          status: 'pending',
          created_at: Time.now.iso8601,
          updated_at: Time.now.iso8601
        }
      }
    end
    
    # 勤怠履歴の取得
    def get_history
      period = params[:period] || 'daily'
      
      # ダミーデータ
      history_data = case period
      when 'daily'
        Array.new(7) do |i|
          date = Date.today - i
          {
            id: rand(1..100),
            date: date.iso8601,
            check_in: "09:#{rand(0..15).to_s.rjust(2, '0')}:00",
            check_out: "18:#{rand(0..30).to_s.rjust(2, '0')}:00",
            total_hours: rand(7.5..9.0).round(2),
            overtime_hours: rand(0..1.5).round(2),
            status: ["present", "present", "present", "late", "present"].sample,
            created_at: Time.now.iso8601,
            updated_at: Time.now.iso8601
          }
        end
      when 'weekly'
        Array.new(4) do |i|
          week_start = Date.today.beginning_of_week - (i * 7)
          {
            week: "#{week_start.strftime('%Y-%m-%d')}〜#{(week_start + 6).strftime('%Y-%m-%d')}",
            total_days: 5,
            present_days: rand(4..5),
            absent_days: rand(0..1),
            total_hours: rand(38..45).round(2),
            overtime_hours: rand(0..7).round(2)
          }
        end
      when 'monthly'
        Array.new(6) do |i|
          month = Date.today - i.months
          {
            month: month.strftime('%Y-%m'),
            total_days: rand(20..23),
            present_days: rand(18..22),
            absent_days: rand(0..2),
            late_days: rand(0..3),
            total_hours: rand(160..180).round(2),
            overtime_hours: rand(0..20).round(2)
          }
        end
      end
      
      render json: { success: true, data: history_data }
    end
    
    # 勤怠サマリーの取得
    def get_summary
      summary = {
        total_days: 22,
        present_days: 20,
        absent_days: 1,
        late_days: 1,
        total_hours: 168.5,
        total_overtime: 8.5,
        leave_balance: {
          paid: 15,
          sick: 5
        }
      }
      
      render json: { success: true, data: summary }
    end
  end
end 
