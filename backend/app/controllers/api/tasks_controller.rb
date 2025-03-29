module Api
  class TasksController < ApplicationController
    before_action :authenticate_user!, except: [:index, :show]
    before_action :authenticate_user, only: [:index, :show, :my, :calendar, :dashboard]
    before_action :set_task, only: [:show, :update, :destroy, :update_status, :assign, :toggle_subtask]

    # タスク一覧の取得
    def index
      # フィルタリングと並び替え
      tasks = Task.parent_tasks  # 親タスクのみを取得
      
      # ステータスでフィルタリング
      if params[:status].present?
        tasks = tasks.where(status: params[:status])
      end
      
      # 優先度でフィルタリング
      if params[:priority].present?
        tasks = tasks.where(priority: params[:priority])
      end
      
      # タグでフィルタリング
      if params[:tag].present?
        tasks = tasks.where("tags LIKE ?", "%#{params[:tag]}%")
      end
      
      # 期限でフィルタリング
      if params[:due_date_from].present?
        tasks = tasks.where("due_date >= ?", params[:due_date_from])
      end
      
      if params[:due_date_to].present?
        tasks = tasks.where("due_date <= ?", params[:due_date_to])
      end
      
      # 並び替え
      case params[:sort_by]
      when 'priority'
        tasks = tasks.order(priority: params[:sort_order] || :desc)
      when 'due_date'
        tasks = tasks.order(due_date: params[:sort_order] || :asc)
      else
        tasks = tasks.order(created_at: params[:sort_order] || :desc)
      end
      
      # ページネーション
      tasks = tasks.page(params[:page] || 1).per(params[:per_page] || 10)
      
      render json: {
        success: true,
        data: tasks.as_json(include: :subtasks),  # サブタスクを含める
        meta: {
          current_page: tasks.current_page,
          total_pages: tasks.total_pages,
          total_count: tasks.total_count,
          per_page: tasks.limit_value
        }
      }, status: :ok
    rescue => e
      render json: { success: false, message: e.message }, status: :internal_server_error
    end

    # 自分のタスク一覧
    def my
      puts "Getting tasks for user: #{current_user.id} (#{current_user.email})" if Rails.env.development?
      tasks = current_user.tasks.parent_tasks.order(created_at: :desc)  # 親タスクのみ取得
      render json: { success: true, data: tasks.as_json(include: :subtasks) }  # サブタスクを含める
    rescue => e
      puts "Error in my tasks: #{e.message}" if Rails.env.development?
      render json: { success: false, message: e.message }, status: :internal_server_error
    end

    # タスク詳細の取得
    def show
      render json: { success: true, data: @task.as_json(include: :subtasks) }  # サブタスクを含める
    end

    # タスクの作成
    def create
      task = current_user.tasks.build(task_params)
      
      # トランザクション開始
      ActiveRecord::Base.transaction do
        if task.save
          # サブタスクの処理
          if params[:task][:subtasks].present?
            params[:task][:subtasks].each do |subtask_params|
              subtask = current_user.tasks.build(
                title: subtask_params[:title],
                status: 'pending',
                parent_task_id: task.id,
                organization_id: task.organization_id
              )
              subtask.save!
            end
          end
          
          render json: { success: true, data: task.reload.as_json(include: :subtasks), message: 'タスクが作成されました' }, status: :created
        else
          render json: { success: false, errors: task.errors.full_messages }, status: :unprocessable_entity
        end
      end
    rescue => e
      render json: { success: false, message: e.message }, status: :unprocessable_entity
    end

    # タスクの更新
    def update
      # トランザクション開始
      ActiveRecord::Base.transaction do
        if @task.update(task_params)
          # サブタスクの更新処理
          if params[:task][:subtasks].present?
            # 既存のサブタスクのIDを取得
            existing_subtask_ids = @task.subtasks.pluck(:id)
            updated_subtask_ids = []
            
            params[:task][:subtasks].each do |subtask_params|
              if subtask_params[:id].present?
                # 既存のサブタスクを更新
                subtask = Task.find_by(id: subtask_params[:id])
                if subtask.present?
                  subtask.update!(
                    title: subtask_params[:title],
                    status: subtask_params[:completed] ? 'completed' : 'pending'
                  )
                  updated_subtask_ids << subtask.id
                end
              else
                # 新しいサブタスクを作成
                subtask = current_user.tasks.build(
                  title: subtask_params[:title],
                  status: subtask_params[:completed] ? 'completed' : 'pending',
                  parent_task_id: @task.id,
                  organization_id: @task.organization_id
                )
                subtask.save!
                updated_subtask_ids << subtask.id
              end
            end
            
            # 削除されたサブタスクを処理
            subtasks_to_delete = existing_subtask_ids - updated_subtask_ids
            Task.where(id: subtasks_to_delete).destroy_all if subtasks_to_delete.any?
          end
          
          render json: { success: true, data: @task.reload.as_json(include: :subtasks), message: 'タスクが更新されました' }
        else
          render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
        end
      end
    rescue => e
      render json: { success: false, message: e.message }, status: :unprocessable_entity
    end

    # タスクの削除
    def destroy
      @task.destroy
      render json: { success: true, message: 'タスクが削除されました' }
    end

    # タスクのステータス更新
    def update_status
      if @task.update(status: params[:status])
        render json: { success: true, data: @task.reload.as_json(include: :subtasks), message: 'ステータスが更新されました' }
      else
        render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # タスクの担当者を変更
    def assign
      user = User.find_by(id: params[:user_id])
      
      if user.nil?
        return render json: { success: false, message: '指定されたユーザーが見つかりません' }, status: :not_found
      end
      
      @task.assigned_to = user.id
      
      if @task.save
        render json: { success: true, data: @task.reload.as_json(include: :subtasks), message: '担当者が変更されました' }
      else
        render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
      end
    end
    
    # カレンダービュー用のタスクデータ
    def calendar
      start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.current.beginning_of_month
      end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : Date.current.end_of_month
      
      tasks = current_user.tasks.parent_tasks
        .where('due_date BETWEEN ? AND ?', start_date, end_date)
        .order(due_date: :asc)
      
      # カレンダー表示用にデータを整形
      calendar_data = tasks.group_by { |task| task.due_date.to_s }
      
      render json: { success: true, data: calendar_data }
    rescue => e
      render json: { success: false, message: e.message }, status: :internal_server_error
    end
    
    # ダッシュボード用のタスク統計情報
    def dashboard
      # 最近のタスク
      recent_tasks = current_user.tasks.parent_tasks.recent.limit(5)
      
      # 優先度別タスク数
      priority_counts = {
        high: current_user.tasks.parent_tasks.high_priority.count,
        medium: current_user.tasks.parent_tasks.where(priority: 'medium').count,
        low: current_user.tasks.parent_tasks.where(priority: 'low').count
      }
      
      # ステータス別タスク数
      status_counts = {
        pending: current_user.tasks.parent_tasks.pending.count,
        in_progress: current_user.tasks.parent_tasks.in_progress.count,
        completed: current_user.tasks.parent_tasks.completed.count
      }
      
      # 期日間近のタスク
      upcoming_tasks = current_user.tasks.parent_tasks.due_soon.where.not(status: 'completed').limit(5)
      
      # 期限切れタスク
      overdue_tasks = current_user.tasks.parent_tasks.overdue.limit(5)
      
      render json: {
        success: true,
        data: {
          recent_tasks: recent_tasks.as_json(include: :subtasks),
          priority_counts: priority_counts,
          status_counts: status_counts,
          upcoming_tasks: upcoming_tasks.as_json(include: :subtasks),
          overdue_tasks: overdue_tasks.as_json(include: :subtasks)
        }
      }
    rescue => e
      render json: { success: false, message: e.message }, status: :internal_server_error
    end
    
    # 複数タスクの一括更新
    def batch_update
      tasks_params = params[:tasks]
      results = { success: [], failed: [] }
      
      tasks_params.each do |task_param|
        task = Task.find_by(id: task_param[:id])
        
        if task.nil?
          results[:failed] << { id: task_param[:id], error: "タスクが見つかりません" }
          next
        end
        
        # タスクの更新
        if task.update(task_param.permit(:title, :description, :status, :priority, :due_date, :assigned_to, :tags))
          results[:success] << { id: task.id }
        else
          results[:failed] << { id: task.id, errors: task.errors.full_messages }
        end
      end
      
      render json: { success: true, data: results }
    rescue => e
      render json: { success: false, message: e.message }, status: :internal_server_error
    end
    
    # タスクの並び替え（ドラッグ＆ドロップでの順序変更）
    def reorder
      task_ids = params[:task_ids]
      
      if task_ids.blank?
        return render json: { success: false, message: 'タスクIDが指定されていません' }, status: :bad_request
      end
      
      # 並べ替え処理を実装
      # ここでは優先度順で自動的に並べる例を示す
      task_ids.each_with_index do |task_id, index|
        task = Task.find_by(id: task_id)
        if task.present?
          # インデックスに基づいて優先度を設定
          priority = case index
                    when 0..2 then 'high'
                    when 3..7 then 'medium'
                    else 'low'
                    end
          
          task.update(priority: priority)
        end
      end
      
      render json: { success: true, message: 'タスクの順序が更新されました' }
    rescue => e
      render json: { success: false, message: e.message }, status: :internal_server_error
    end

    # サブタスクの完了状態を切り替える
    def toggle_subtask
      subtask = Task.find_by(id: params[:subtask_id], parent_task_id: @task.id)
      
      if subtask.nil?
        return render json: { success: false, message: 'サブタスクが見つかりません' }, status: :not_found
      end
      
      # ステータスの切り替え
      new_status = subtask.status == 'completed' ? 'pending' : 'completed'
      
      if subtask.update(status: new_status)
        render json: { 
          success: true, 
          data: {
            subtask: subtask,
            parent_task: @task.as_json(include: :subtasks)
          }, 
          message: 'サブタスクのステータスが更新されました' 
        }
      else
        render json: { success: false, errors: subtask.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def set_task
      @task = Task.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { success: false, message: 'タスクが見つかりません' }, status: :not_found
    end

    def task_params
      params.require(:task).permit(:title, :description, :status, :priority, :due_date, :assigned_to, :tags, :organization_id, :parent_task_id)
    end
  end
end
