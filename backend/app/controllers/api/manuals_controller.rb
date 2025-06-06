module Api
  class ManualsController < ApplicationController
    include ErrorHandler  # グローバルエラーハンドリング（本番環境では詳細情報を隠蔽）
    
    before_action :authenticate_user
    before_action :set_manual, only: [:show, :update, :destroy]
    before_action :check_edit_permission, only: [:update, :destroy]

    # GET /api/manuals
    # マニュアル一覧の取得
    def index
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
      
      # ステータスでフィルター（バックエンドで処理）
      if params[:status].present? && params[:status] != 'all'
        @manuals = @manuals.where(status: params[:status])
      end
      
      # 検索クエリでフィルター（SQLインジェクション対策）
      if params[:query].present?
        sanitized_query = ActiveRecord::Base.sanitize_sql_like(params[:query])
        @manuals = @manuals.where('title ILIKE ? OR content ILIKE ?', "%#{sanitized_query}%", "%#{sanitized_query}%")
      end
      
      # ソート順（デフォルトは更新日時の降順）
      @manuals = @manuals.order(updated_at: :desc)
      
      # ページネーション
      page_size = [params[:per_page]&.to_i || 10, 100].min # 最大100件まで
      paginated = @manuals.page(params[:page] || 1).per(page_size)
      
      # シリアライザーを使ってJSONレスポンスを生成
      manuals_collection_response(@manuals, paginated)
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
      
      # タイトルでフィルター（SQLインジェクション対策）
      if params[:title].present?
        sanitized_title = ActiveRecord::Base.sanitize_sql_like(params[:title])
        @manuals = @manuals.where('title ILIKE ?', "%#{sanitized_title}%")
      end
      
      # 内容でフィルター（SQLインジェクション対策）
      if params[:content].present?
        sanitized_content = ActiveRecord::Base.sanitize_sql_like(params[:content])
        @manuals = @manuals.where('content ILIKE ?', "%#{sanitized_content}%")
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
      
      # 検索結果レスポンス（フィルターとソート情報を含む）
      search_response(@manuals, paginated, order_column, order_direction)
    end
    
    # GET /api/manuals/stats
    # ダッシュボード用の統計情報を取得
    def stats
      all_manuals = Manual.accessible_by(current_user)
      my_manuals = Manual.where(user_id: current_user.id)
      
      stats = {
        total: all_manuals.count,
        published: all_manuals.where(status: 'published').count,
        drafts: my_manuals.where(status: 'draft').count,
        my_manuals: my_manuals.count
      }
      
      render json: {
        success: true,
        data: stats
      }
    end

    # GET /api/manuals/my
    # 自分が作成したマニュアル一覧
    def my
      @manuals = Manual.where(user_id: current_user.id)
      
      # ステータスでフィルター
      if params[:status].present? && params[:status] != 'all'
        @manuals = @manuals.where(status: params[:status])
      end
      
      # ページネーション
      paginated = @manuals.page(params[:page] || 1).per(params[:per_page] || 10)
      
      manuals_collection_response(@manuals, paginated)
    end

    # GET /api/manuals/:id
    # 特定のマニュアル詳細を取得
    def show
      # 閲覧権限のチェック
      unless can_view?(@manual)
        return handle_forbidden('このマニュアルを閲覧する権限がありません')
      end

      manual_response(@manual)
    end

    # POST /api/manuals
    # 新しいマニュアルを作成
    def create
      @manual = Manual.new(manual_params)
      @manual.user = current_user

      if @manual.save
        manual_response(@manual, message: 'マニュアルが正常に作成されました', status: :created)
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
        manual_response(@manual, message: 'マニュアルが正常に更新されました')
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

    # マニュアル用レスポンス生成ヘルパー
    def manual_response(manual, message: nil, status: :ok)
      serialized_data = ManualSerializer.new(manual, current_user: current_user).as_json
      response_body = {
        success: true,
        data: serialized_data
      }
      response_body[:message] = message if message.present?
      
      render json: response_body, status: status
    end

    # マニュアル一覧用レスポンス生成ヘルパー
    def manuals_collection_response(manuals, paginated, message: nil)
      # 手動でシリアライズ（ActiveModel::Serializer::CollectionSerializerの問題を回避）
      serialized_data = paginated.map do |manual|
        ManualSerializer.new(manual, current_user: current_user).as_json
      end
      
      response_body = {
        success: true,
        data: {
          data: serialized_data,
          meta: {
            total_count: manuals.count,
            total_pages: paginated.total_pages,
            current_page: paginated.current_page
          }
        }
      }
      response_body[:message] = message if message.present?
      
      render json: response_body
    end

    # 検索結果用レスポンス生成ヘルパー（フィルターとソート情報を含む）
    def search_response(manuals, paginated, order_column, order_direction)
      serialized_data = ActiveModel::Serializer::CollectionSerializer.new(
        paginated, 
        serializer: ManualSerializer,
        current_user: current_user
      ).as_json
      
      render json: {
        success: true,
        data: serialized_data,
        meta: {
          total_count: manuals.count,
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


  end
end 
