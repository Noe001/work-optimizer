module Api
  class AttendanceController < ApplicationController
    before_action :authenticate_user!
    
    # 勤怠データの取得
    def index
      today_attendance = current_user.today_attendance
      
      if today_attendance
        render json: { success: true, data: format_attendance(today_attendance) }
      else
        render json: { 
          success: true, 
          data: {
            date: Date.current.iso8601,
            check_in: nil,
            check_out: nil,
            total_hours: nil,
            overtime_hours: nil,
            status: 'pending'
          }
        }
      end
    end
    
    # 出勤打刻
    def check_in
      today = Date.current
      Rails.logger.info("勤怠登録: ユーザーID=#{current_user.id}, 日付=#{today}")
      
      # 既存のデータがあるか確認
      attendance = current_user.attendances.find_by(date: today)
      
      # 打刻データが既に存在するか確認
      if attendance
        # 既に出勤打刻がある場合はエラー
        if attendance.check_in.present?
          Rails.logger.info("勤怠登録エラー: 既に出勤打刻済み")
          return render json: { success: false, message: '既に出勤打刻済みです' }, status: :bad_request
        end
      else
        # 勤怠データがなければ新規作成
        attendance = current_user.attendances.new(date: today)
      end
      
      # 打刻情報を設定
      attendance.check_in = Time.current
      attendance.status = 'present'
      
      # 9時以降なら遅刻
      if Time.current.hour >= 9 && Time.current.min > 0
        attendance.status = 'late'
      end
      
      begin
        if attendance.save
          Rails.logger.info("勤怠登録成功: ID=#{attendance.id}")
          render json: { 
            success: true, 
            message: '出勤を記録しました',
            data: format_attendance(attendance)
          }
        else
          Rails.logger.error("勤怠登録失敗: エラー=#{attendance.errors.full_messages.join(', ')}")
          render json: { success: false, message: attendance.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      rescue => e
        Rails.logger.error("勤怠登録例外: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        render json: { success: false, message: "予期せぬエラーが発生しました: #{e.message}" }, status: :internal_server_error
      end
    end
    
    # 退勤打刻
    def check_out
      today = Date.current
      attendance = current_user.attendances.find_by(date: today)
      
      unless attendance
        return render json: { success: false, message: '出勤記録が見つかりません' }, status: :bad_request
      end
      
      if attendance.check_out.present?
        return render json: { success: false, message: '既に退勤打刻済みです' }, status: :bad_request
      end
      
      attendance.check_out = Time.current
      
      if attendance.save
        render json: { 
          success: true, 
          message: '退勤を記録しました',
          data: format_attendance(attendance)
        }
      else
        render json: { success: false, message: attendance.errors.full_messages.join(', ') }, status: :unprocessable_entity
      end
    end
    
    # 勤怠記録の更新
    def update
      attendance = find_attendance_by_id_or_date
      
      unless attendance
        return render json: { success: false, message: '勤怠記録が見つかりません' }, status: :not_found
      end
      
      # 更新パラメータ
      update_params = attendance_params
      
      # 時刻フォーマットの変換
      if update_params[:check_in].present?
        hour, min = update_params[:check_in].split(':')
        date = attendance.date
        check_in_time = Time.zone.local(date.year, date.month, date.day, hour.to_i, min.to_i)
        update_params[:check_in] = check_in_time
      end
      
      if update_params[:check_out].present?
        hour, min = update_params[:check_out].split(':')
        date = attendance.date
        check_out_time = Time.zone.local(date.year, date.month, date.day, hour.to_i, min.to_i)
        update_params[:check_out] = check_out_time
      end
      
      if attendance.update(update_params)
        render json: { 
          success: true, 
          message: '勤怠記録を更新しました',
          data: format_attendance(attendance)
        }
      else
        render json: { success: false, message: attendance.errors.full_messages.join(', ') }, status: :unprocessable_entity
      end
    end
    
    # 休暇申請
    def request_leave
      leave_request = current_user.leave_requests.new(leave_request_params)
      
      if leave_request.save
        render json: { 
          success: true, 
          message: '休暇申請が送信されました',
          data: format_leave_request(leave_request)
        }
      else
        render json: { success: false, message: leave_request.errors.full_messages.join(', ') }, status: :unprocessable_entity
      end
    end
    
    # 勤怠履歴の取得
    def history
      period = params[:period] || 'daily'
      date_from = params[:date_from].present? ? Date.parse(params[:date_from]) : Date.current.beginning_of_month
      date_to = params[:date_to].present? ? Date.parse(params[:date_to]) : Date.current
      
      case period
      when 'daily'
        attendances = current_user.attendances
                                  .where(date: date_from..date_to)
                                  .order(date: :desc)
                               
        render json: { 
          success: true, 
          data: attendances.map { |attendance| format_attendance(attendance) }
        }
      when 'weekly'
        # 週次集計の実装
        weekly_data = []
        current_date = date_to
        
        4.times do |i|
          week_start = current_date.beginning_of_week
          week_end = current_date.end_of_week
          
          week_attendances = current_user.attendances.where(date: week_start..week_end)
          present_days = week_attendances.where(status: ['present', 'late']).count
          absent_days = week_end.cwday >= 5 ? 5 - present_days : week_end.cwday - present_days
          total_hours = week_attendances.sum(:total_hours)
          overtime_hours = week_attendances.sum(:overtime_hours)
          
          weekly_data << {
            week: "#{week_start.strftime('%Y-%m-%d')}〜#{week_end.strftime('%Y-%m-%d')}",
            total_days: 5, # 平日の日数
            present_days: present_days,
            absent_days: absent_days,
            total_hours: total_hours.round(2),
            overtime_hours: overtime_hours.round(2)
          }
          
          current_date = week_start - 1.day
        end
        
        render json: { success: true, data: weekly_data }
      when 'monthly'
        # 月次集計の実装
        monthly_data = []
        current_date = date_to
        
        6.times do |i|
          month_start = current_date.beginning_of_month
          month_end = current_date.end_of_month
          
          month_attendances = current_user.attendances.where(date: month_start..month_end)
          present_days = month_attendances.where(status: 'present').count
          late_days = month_attendances.where(status: 'late').count
          absent_days = business_days_in_month(month_start) - present_days - late_days
          total_hours = month_attendances.sum(:total_hours)
          overtime_hours = month_attendances.sum(:overtime_hours)
          
          monthly_data << {
            month: month_start.strftime('%Y-%m'),
            total_days: business_days_in_month(month_start),
            present_days: present_days,
            absent_days: absent_days,
            late_days: late_days,
            total_hours: total_hours.round(2),
            overtime_hours: overtime_hours.round(2)
          }
          
          current_date = month_start - 1.day
        end
        
        render json: { success: true, data: monthly_data }
      else
        render json: { success: false, message: '無効な期間パラメータです' }, status: :bad_request
      end
    end
    
    # 休暇申請履歴
    def leave_history
      leave_requests = current_user.leave_requests.order(created_at: :desc)
      
      render json: { 
        success: true, 
        data: leave_requests.map { |request| format_leave_request(request) }
      }
    end
    
    # 勤怠サマリーの取得
    def summary
      # 当月の集計
      month_start = Date.current.beginning_of_month
      month_end = Date.current.end_of_month
      
      month_attendances = current_user.attendances.where(date: month_start..month_end)
      present_days = month_attendances.where(status: 'present').count
      late_days = month_attendances.where(status: 'late').count
      absent_days = business_days_in_month(month_start) - present_days - late_days
      total_hours = month_attendances.sum(:total_hours)
      overtime_hours = month_attendances.sum(:overtime_hours)
      
      summary = {
        total_days: business_days_in_month(month_start),
        present_days: present_days,
        absent_days: absent_days,
        late_days: late_days,
        total_hours: total_hours.round(2),
        total_overtime: overtime_hours.round(2),
        leave_balance: {
          paid: current_user.paid_leave_balance,
          sick: current_user.sick_leave_balance
        }
      }
      
      render json: { success: true, data: summary }
    end
    
    private
    
    def attendance_params
      params.permit(:date, :check_in, :check_out, :status, :comment)
    end
    
    def leave_request_params
      params.permit(:leave_type, :start_date, :end_date, :reason)
    end
    
    def find_attendance_by_id_or_date
      if params[:id].present?
        current_user.attendances.find_by(id: params[:id])
      elsif params[:date].present?
        current_user.attendances.find_by(date: params[:date])
      else
        current_user.today_attendance
      end
    end
    
    def format_attendance(attendance)
      {
        id: attendance.id,
        date: attendance.date.iso8601,
        check_in: attendance.check_in&.strftime('%H:%M:%S'),
        check_out: attendance.check_out&.strftime('%H:%M:%S'),
        total_hours: attendance.total_hours,
        overtime_hours: attendance.overtime_hours,
        status: attendance.status,
        comment: attendance.comment,
        created_at: attendance.created_at.iso8601,
        updated_at: attendance.updated_at.iso8601
      }
    end
    
    def format_leave_request(leave_request)
      {
        id: leave_request.id,
        leave_type: leave_request.leave_type,
        start_date: leave_request.start_date.iso8601,
        end_date: leave_request.end_date.iso8601,
        duration: leave_request.duration_days,
        reason: leave_request.reason,
        status: leave_request.status,
        created_at: leave_request.created_at.iso8601,
        updated_at: leave_request.updated_at.iso8601
      }
    end
    
    def business_days_in_month(date)
      start_date = date.beginning_of_month
      end_date = date.end_of_month
      business_days = 0
      
      (start_date..end_date).each do |day|
        business_days += 1 if (1..5).include?(day.wday)
      end
      
      business_days
    end
  end
end 
