module Api
  class ManualsController < ApplicationController
    include ErrorHandler
    
    before_action :authenticate_user
    before_action :set_manual, only: [:show, :update, :destroy]
    before_action :check_edit_permission, only: [:update, :destroy]

    # GET /api/manuals
    # マニュアル一覧の取得
    def index
      begin
        # フィルター条件に応じてマニュアルを取得（N+1クエリ解消のためincludesを使用）
        @manuals = Manual.includes(:user).accessible_by(current_user)
        
        # 部門でフィルター
        if params[:department].present? && params[:department] != 'all'
          @manuals = @manuals.where(department: params[:department])
        end
        
        # カテゴリでフィルター
        if params[:category].present? && params[:category] != 'all'
          @manuals = @manuals.where(category: params[:category])
        end
        
        # 検索クエリでフィルター（SQLインジェクション対策）
        if params[:query].present?
          sanitized_query = ActiveRecord::Base.sanitize_sql_like(params[:query])
          @manuals = @manuals.where('title ILIKE ?', "%#{sanitized_query}%")
        end
        
        # ソート順（デフォルトは更新日時の降順）
        @manuals = @manuals.order(updated_at: :desc)
        
        # ページネーション
        page_size = [params[:per_page]&.to_i || 10, 100].min # 最大100件まで
        paginated = @manuals.page(params[:page] || 1).per(page_size)
        
        # シリアライザーを使ってJSONレスポンスを生成
        serialized_data = ActiveModel::Serializer::CollectionSerializer.new(
          paginated, 
          serializer: ManualSerializer,
          current_user: current_user
        ).as_json
        
        render json: {
          success: true,
          data: {
            data: serialized_data,
            meta: {
              total_count: @manuals.count,
              total_pages: paginated.total_pages,
              current_page: paginated.current_page
            }
          }
        }
      rescue => e
        render json: {
          success: false,
          message: "エラー: #{e.class} - #{e.message}",
          code: e.class.name,
          errors: [],
          timestamp: Time.current.iso8601
        }, status: :internal_server_error
      end
    end

    # GET /api/manuals/search
    # マニュアルの詳細検索
    def search
      @manuals = Manual.includes(:user).accessible_by(current_user)
      
      # 部門でフィルター
      if params[:department].present?
        @manuals = @manuals.where(department: params[:department])
      end
      
      # カテゴリでフィルター
      if params[:category].present?
        @manuals = @manuals.where(category: params[:category])
      end
      
      # タイトルでフィルター
      if params[:title].present?
        @manuals = @manuals.where('title LIKE ?', "%#{params[:title]}%")
      end
      
      # 内容でフィルター
      if params[:content].present?
        @manuals = @manuals.where('content LIKE ?', "%#{params[:content]}%")
      end
      
      # 作成者でフィルター
      if params[:author_id].present?
        @manuals = @manuals.where(user_id: params[:author_id])
      end
      
      # 作成日でフィルター
      if params[:created_after].present?
        @manuals = @manuals.where('created_at >= ?', params[:created_after])
      end
      
      if params[:created_before].present?
        @manuals = @manuals.where('created_at <= ?', params[:created_before])
      end
      
      # 更新日でフィルター
      if params[:updated_after].present?
        @manuals = @manuals.where('updated_at >= ?', params[:updated_after])
      end
      
      if params[:updated_before].present?
        @manuals = @manuals.where('updated_at <= ?', params[:updated_before])
      end
      
      # ソート順
      order_column = params[:order_by] || 'updated_at'
      order_direction = params[:order] || 'desc'
      
      # 有効なソートカラムかチェック
      valid_sort_columns = %w[title created_at updated_at]
      order_column = 'updated_at' unless valid_sort_columns.include?(order_column)
      
      # 有効なソート方向かチェック
      valid_directions = %w[asc desc]
      order_direction = 'desc' unless valid_directions.include?(order_direction)
      
      @manuals = @manuals.order("#{order_column} #{order_direction}")
      
      # ページネーション
      paginated = @manuals.page(params[:page] || 1).per(params[:per_page] || 10)
      
      render json: {
        success: true,
        data: ActiveModel::Serializer::CollectionSerializer.new(
          paginated, 
          serializer: ManualSerializer,
          current_user: current_user
        ).as_json,
        meta: {
          total_count: @manuals.count,
          total_pages: paginated.total_pages,
          current_page: paginated.current_page,
          filters: {
            department: params[:department],
            category: params[:category],
            title: params[:title],
            content: params[:content],
            author_id: params[:author_id],
            created_after: params[:created_after],
            created_before: params[:created_before],
            updated_after: params[:updated_after],
            updated_before: params[:updated_before]
          },
          sort: {
            order_by: order_column,
            order: order_direction
          }
        }
      }
    end
    
    # GET /api/manuals/my
    # 自分が作成したマニュアル一覧
    def my
      @manuals = Manual.where(user_id: current_user.id)
      
      # ステータスでフィルター
      if params[:status].present?
        @manuals = @manuals.where(manuals: { status: params[:status] })
      end
      
      # ページネーション
      paginated = @manuals.page(params[:page] || 1).per(params[:per_page] || 10)
      
      render json: {
        success: true,
        data: ActiveModel::Serializer::CollectionSerializer.new(
          paginated, 
          serializer: ManualSerializer,
          current_user: current_user
        ).as_json,
        meta: {
          total_count: @manuals.count,
          total_pages: paginated.total_pages,
          current_page: paginated.current_page
        }
      }
    end

    # GET /api/manuals/:id
    # 特定のマニュアル詳細を取得
    def show
      # 閲覧権限のチェック
      unless can_view?(@manual)
        return handle_forbidden('このマニュアルを閲覧する権限がありません')
      end

      serialized_data = ManualSerializer.new(@manual, current_user: current_user).as_json
      render json: {
        success: true,
        data: serialized_data
      }
    end

    # POST /api/manuals
    # 新しいマニュアルを作成
    def create
      @manual = Manual.new(manual_params)
      @manual.user = current_user

      if @manual.save
        # 手動シリアライゼーション
        manual_data = {
          id: @manual.id,
          title: @manual.title,
          content: @manual.content,
          department: @manual.department,
          category: @manual.category,
          access_level: @manual.access_level,
          edit_permission: @manual.edit_permission,
          status: @manual.status,
          created_at: @manual.created_at,
          updated_at: @manual.updated_at,
          tags: @manual.tags,
          author: {
            id: @manual.user.id,
            name: @manual.user.name
          },
          can_edit: @manual.user_id == current_user.id
        }
        
        response_data = {
          success: true,
          message: 'マニュアルが正常に作成されました',
          data: manual_data
        }
        
        render json: response_data, status: :created
      else
        render json: {
          success: false,
          message: 'マニュアルの作成に失敗しました',
          errors: @manual.errors.full_messages
        }, status: :unprocessable_entity
      end
    end

    # PUT/PATCH /api/manuals/:id
    # マニュアルを更新
    def update
      if @manual.update(manual_params)
        serialized_data = ManualSerializer.new(@manual, current_user: current_user).as_json
        render json: {
          success: true,
          message: 'マニュアルが正常に更新されました',
          data: serialized_data
        }
      else
        render json: {
          success: false,
          message: 'マニュアルの更新に失敗しました',
          errors: @manual.errors.full_messages
        }, status: :unprocessable_entity
      end
    end

    # DELETE /api/manuals/:id
    # マニュアルを削除
    def destroy
      if @manual.destroy
        render json: {
          success: true,
          message: 'マニュアルが正常に削除されました'
        }
      else
        render json: {
          success: false,
          message: 'マニュアルの削除に失敗しました',
          errors: @manual.errors.full_messages
        }, status: :unprocessable_entity
      end
    end

    private

    # マニュアルを設定
    def set_manual
      @manual = Manual.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: {
        success: false,
        message: '指定されたマニュアルは存在しません'
      }, status: :not_found
    end

    # 編集権限のチェック
    def check_edit_permission
      unless can_edit?(@manual)
        handle_forbidden('このマニュアルを編集する権限がありません')
      end
    end

    # 閲覧権限のチェック
    def can_view?(manual)
      # 下書き状態のマニュアルは作成者のみ閲覧可能
      return manual.user_id == current_user.id if manual.draft?

      # 公開済みマニュアルの場合はアクセスレベルに基づいてチェック
      if manual.access_all?
        true # 全社員がアクセス可能
      elsif manual.access_department?
        manual.department == current_user.department # 同じ部門のみアクセス可能
      elsif manual.access_specific?
        # 特定のユーザーにアクセス権限がある場合の処理
        # この実装はプロジェクトの要件に応じて拡張する必要があります
        manual.user_id == current_user.id # 仮実装：作成者のみアクセス可能
      else
        false
      end
    end

    # 編集権限のチェック
    def can_edit?(manual)
      if manual.edit_author?
        manual.user_id == current_user.id
      elsif manual.edit_department?
        manual.department == current_user.department && current_user.department_admin?
      elsif manual.edit_specific?
        # 特定のユーザーに編集権限がある場合の処理
        # この実装はプロジェクトの要件に応じて拡張する必要があります
        manual.user_id == current_user.id
      else
        false
      end
    end

    # マニュアルのパラメータ
    def manual_params
      params.require(:manual).permit(
        :title, 
        :content, 
        :department, 
        :category, 
        :access_level, 
        :edit_permission, 
        :status,
        :tags
      )
    end

    # 開発環境でのみテスト用ユーザーを使用
    def current_user
      if Rails.env.development?
        @current_user ||= User.first
      else
        # 本番環境では適切な認証システムからユーザーを取得
        super
      end
    end
  end
end 
