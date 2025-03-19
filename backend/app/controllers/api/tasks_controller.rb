module Api
  class TasksController < ApplicationController
    before_action :authenticate_user!, except: [:index, :show]
    before_action :authenticate_user, only: [:index, :show, :my]
    before_action :set_task, only: [:show, :update, :destroy, :update_status, :assign]

    # タスク一覧の取得
    def index
      # フィルタリングと並び替え
      tasks = Task.all
      
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
        data: tasks,
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
      tasks = current_user.tasks.order(created_at: :desc)
      render json: { success: true, data: tasks }
    rescue => e
      puts "Error in my tasks: #{e.message}" if Rails.env.development?
      render json: { success: false, message: e.message }, status: :internal_server_error
    end

    # タスク詳細の取得
    def show
      render json: { success: true, data: @task }
    end

    # タスクの作成
    def create
      task = current_user.tasks.build(task_params)
      
      if task.save
        render json: { success: true, data: task, message: 'タスクが作成されました' }, status: :created
      else
        render json: { success: false, errors: task.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # タスクの更新
    def update
      if @task.update(task_params)
        render json: { success: true, data: @task, message: 'タスクが更新されました' }
      else
        render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # タスクの削除
    def destroy
      @task.destroy
      render json: { success: true, message: 'タスクが削除されました' }
    end

    # タスクのステータス更新
    def update_status
      if @task.update(status: params[:status])
        render json: { success: true, data: @task, message: 'ステータスが更新されました' }
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
        render json: { success: true, data: @task, message: '担当者が変更されました' }
      else
        render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def set_task
      @task = Task.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { success: false, message: 'タスクが見つかりません' }, status: :not_found
    end

    def task_params
      params.require(:task).permit(:title, :description, :status, :priority, :due_date, :assigned_to, :tags)
    end
  end
end
