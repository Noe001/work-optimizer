class Api::V1::TasksController < ApplicationController
  before_action :authenticate_user!
  before_action :set_task, only: [:show, :update, :destroy, :attach_file, :remove_attachment, :download_attachment]
  
  # タスク一覧を取得
  def index
    @tasks = current_user.tasks.includes(:tags)
    
    # 組織フィルター
    if params[:organization_id].present?
      @tasks = @tasks.where(organization_id: params[:organization_id])
    end
    
    # ステータスフィルター
    if params[:status].present?
      @tasks = @tasks.where(status: params[:status])
    end
    
    # 優先度フィルター
    if params[:priority].present?
      @tasks = @tasks.where(priority: params[:priority])
    end
    
    # 期限フィルター
    if params[:due_date_start].present? && params[:due_date_end].present?
      @tasks = @tasks.where("due_date BETWEEN ? AND ?", params[:due_date_start], params[:due_date_end])
    elsif params[:due_date_start].present?
      @tasks = @tasks.where("due_date >= ?", params[:due_date_start])
    elsif params[:due_date_end].present?
      @tasks = @tasks.where("due_date <= ?", params[:due_date_end])
    end
    
    # タグフィルター
    if params[:tags].present?
      tags = params[:tags].split(',')
      @tasks = @tasks.tagged_with(tags, any: true)
    end
    
    # 並び替え
    if params[:sort_by].present?
      sort_direction = params[:sort_direction] == 'desc' ? 'DESC' : 'ASC'
      @tasks = @tasks.order("#{params[:sort_by]} #{sort_direction}")
    else
      @tasks = @tasks.order(created_at: :desc)
    end
    
    render json: @tasks, each_serializer: TaskSerializer
  end
  
  # タスク詳細を取得
  def show
    render json: @task, serializer: TaskSerializer
  end
  
  # タスクを作成
  def create
    @task = current_user.tasks.build(task_params)
    
    if @task.save
      render json: @task, serializer: TaskSerializer, status: :created
    else
      render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  # タスクを更新
  def update
    if @task.update(task_params)
      render json: @task, serializer: TaskSerializer
    else
      render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  # タスクを削除
  def destroy
    @task.destroy
    head :no_content
  end
  
  # タスクへのファイル添付
  def attach_file
    # ファイルチェック
    unless params[:attachment].present?
      render json: { error: 'ファイルが添付されていません' }, status: :unprocessable_entity
      return
    end

    # 最大ファイルサイズを10MBに制限
    max_size = 10.megabytes
    if params[:attachment].size > max_size
      render json: { error: "ファイルサイズが大きすぎます。最大10MBまで添付可能です。" }, status: :unprocessable_entity
      return
    end

    # 許可されたMIMEタイプをチェック
    allowed_types = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ]
    
    unless allowed_types.include?(params[:attachment].content_type)
      render json: { error: "このファイル形式はサポートされていません。" }, status: :unprocessable_entity
      return
    end

    # ストレージ診断情報
    Rails.logger.info "ストレージサービス: #{ActiveStorage::Blob.service.class.name}"
    Rails.logger.info "ストレージルートパス: #{Rails.root.join('storage').to_s}"
    
    # ストレージディレクトリの書き込み権限を確認
    storage_path = Rails.root.join('storage')
    storage_exists = Dir.exist?(storage_path)
    storage_writable = storage_exists && File.writable?(storage_path)
    Rails.logger.info "ストレージディレクトリ存在: #{storage_exists}, 書き込み可能: #{storage_writable}"
    
    # ディレクトリがなければ作成を試みる
    unless storage_exists
      begin
        FileUtils.mkdir_p(storage_path)
        Rails.logger.info "ストレージディレクトリを作成しました: #{storage_path}"
      rescue => e
        Rails.logger.error "ストレージディレクトリの作成に失敗: #{e.message}"
      end
    end

    # ファイルを添付
    begin
      # 添付ファイルの情報をログに出力
      Rails.logger.info "添付ファイル情報: 名前=#{params[:attachment].original_filename}, サイズ=#{params[:attachment].size}バイト, タイプ=#{params[:attachment].content_type}"
      
      # ファイルの中身を一時ファイルにコピー（デバッグ用）
      temp_path = Rails.root.join('tmp', "debug_#{SecureRandom.hex(8)}")
      File.binwrite(temp_path, params[:attachment].read)
      params[:attachment].rewind # ファイルポインタを元に戻す
      Rails.logger.info "一時ファイルに保存: #{temp_path} (#{File.size(temp_path)}バイト)"
      
      # 添付処理
      @task.attachments.attach(params[:attachment])
      
      # 添付ID確認
      latest_attachment = @task.attachments.last
      if latest_attachment
        Rails.logger.info "添付成功 - ID: #{latest_attachment.id}, キー: #{latest_attachment.blob.key}"
        
        # 保存先パスを確認
        if ActiveStorage::Blob.service.is_a?(ActiveStorage::Service::DiskService) && 
           ActiveStorage::Blob.service.respond_to?(:path_for)
          storage_path = ActiveStorage::Blob.service.path_for(latest_attachment.blob.key)
          exists = File.exist?(storage_path)
          Rails.logger.info "保存先パス: #{storage_path}, 存在: #{exists}"
          
          unless exists
            Rails.logger.error "保存先ファイルが見つかりません！ディレクトリを確認します"
            dir_path = File.dirname(storage_path)
            dir_exists = Dir.exist?(dir_path)
            dir_writable = dir_exists && File.writable?(dir_path)
            Rails.logger.error "親ディレクトリ: #{dir_path}, 存在: #{dir_exists}, 書き込み可能: #{dir_writable}"
            
            # 緊急対応：一時ファイルから直接コピー
            begin
              FileUtils.mkdir_p(dir_path) unless dir_exists
              FileUtils.cp(temp_path, storage_path)
              Rails.logger.info "緊急対応：一時ファイルから保存先にコピーしました"
            rescue => e
              Rails.logger.error "緊急対応の失敗: #{e.message}"
            end
          end
        end
      end
      
      # デバッグ用一時ファイルの削除
      File.unlink(temp_path) if File.exist?(temp_path)
      
      # 添付成功後、タスクの更新日時を更新
      @task.touch
      render json: @task, serializer: TaskSerializer, status: :ok
    rescue => e
      Rails.logger.error "ファイル添付中にエラーが発生しました: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: "ファイル添付中にエラーが発生しました: #{e.message}" }, status: :unprocessable_entity
    end
  end
  
  # タスクからの添付ファイル削除
  def remove_attachment
    attachment_id = params[:attachment_id]
    
    begin
      attachment = @task.attachments.find(attachment_id)
      attachment.purge
      # 添付ファイル削除後、タスクの更新日時を更新
      @task.touch
      render json: @task, serializer: TaskSerializer, status: :ok
    rescue ActiveRecord::RecordNotFound
      render json: { error: "指定された添付ファイルが見つかりません" }, status: :not_found
    rescue => e
      Rails.logger.error "添付ファイル削除中にエラーが発生しました: #{e.message}"
      render json: { error: "添付ファイル削除中にエラーが発生しました: #{e.message}" }, status: :unprocessable_entity
    end
  end

  # 添付ファイルのダウンロード専用エンドポイント
  def download_attachment
    attachment_id = params[:attachment_id]
    
    begin
      # 添付ファイルを検索
      attachment = @task.attachments.find(attachment_id)
      
      # ファイル情報をログに記録
      Rails.logger.info "添付ファイルのダウンロード: #{attachment.filename} (ID: #{attachment_id}, サイズ: #{attachment.blob.byte_size}バイト)"
      
      # ファイルの存在確認
      if ActiveStorage::Blob.service.is_a?(ActiveStorage::Service::DiskService) && 
         ActiveStorage::Blob.service.respond_to?(:path_for)
        file_path = ActiveStorage::Blob.service.path_for(attachment.blob.key)
        if File.exist?(file_path)
          Rails.logger.info "ファイルパス確認: #{file_path} (#{File.size(file_path)}バイト)"
        else
          Rails.logger.error "ファイルが実際のストレージに存在しません: #{file_path}"
          render json: { error: "ファイルがストレージに見つかりません" }, status: :not_found
          return
        end
      end
      
      # Content-Length問題を解決するための処理
      if Rails.env.development? || Rails.env.test?
        # 開発環境ではストリームを使用
        begin
          attachment_binary = attachment.download
          Rails.logger.info "ダウンロードしたファイルサイズ: #{attachment_binary.bytesize}バイト"
          send_data(
            attachment_binary,
            filename: attachment.filename.to_s,
            disposition: params[:disposition] || "attachment",
            content_type: attachment.content_type,
            status: :ok
          )
        rescue => e
          Rails.logger.error "ファイルダウンロード中にエラーが発生: #{e.message}"
          render json: { error: "ファイルのダウンロード中にエラーが発生しました" }, status: :internal_server_error
        end
      else
        # 本番環境ではActiveStorageのリダイレクト機能を使用
        # Content-Lengthヘッダーが正しく設定される
        redirect_to(
          rails_blob_path(attachment, disposition: params[:disposition] || "attachment"),
          allow_other_host: true
        )
      end
    rescue ActiveRecord::RecordNotFound
      Rails.logger.error "添付ファイルが見つかりません (ID: #{attachment_id})"
      render json: { error: "指定された添付ファイルが見つかりません" }, status: :not_found
    rescue ActiveStorage::FileNotFoundError
      Rails.logger.error "添付ファイルのストレージファイルが見つかりません (ID: #{attachment_id})"
      render json: { error: "ファイルが見つかりません" }, status: :not_found
    rescue => e
      Rails.logger.error "添付ファイルダウンロード中にエラーが発生しました: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: "添付ファイルダウンロード中にエラーが発生しました" }, status: :internal_server_error
    end
  end
  
  private
  
  # タスクを取得
  def set_task
    @task = current_user.tasks.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "タスクが見つかりません" }, status: :not_found
  end
  
  # 許可するパラメータ
  def task_params
    params.require(:task).permit(
      :title, :description, :status, :priority, :due_date, 
      :assigned_to, :organization_id, tag_list: []
    )
  end
end 
