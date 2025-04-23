class TaskSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers
  
  attributes :id, :title, :description, :status, :priority, :due_date, :assigned_to, 
             :created_at, :updated_at, :tag_list, :assignee_name,
             :organization_id, :organization_name, :is_overdue, :is_completed, :time_remaining, :attachment_urls
  has_one :user

  # タグリストを配列として返す
  def tag_list
    object.tag_list
  end

  # 担当者の名前を返す（存在する場合）
  def assignee_name
    return nil if object.assigned_to.blank?
    
    user = User.find_by(id: object.assigned_to)
    user&.name
  end
  
  # 組織名を返す（存在する場合）
  def organization_name
    return nil if object.organization_id.blank?
    
    organization = Organization.find_by(id: object.organization_id)
    organization&.name
  end
  
  # タスクが期限切れかどうか
  def is_overdue
    object.overdue?
  end
  
  # タスクが完了しているかどうか
  def is_completed
    object.completed?
  end
  
  # タスクの残り時間（日数）を返す
  def time_remaining
    return nil if object.due_date.blank?
    
    if object.due_date < Date.current
      return -1 * (Date.current - object.due_date).to_i
    else
      return (object.due_date - Date.current).to_i
    end
  end
  
  # 添付ファイルのURLリストを返す
  def attachment_urls
    return [] unless object.attachments.attached?
      
    Rails.logger.info "タスク(ID: #{object.id})の添付ファイルURL生成開始"
    
    object.attachments.map do |attachment|
      begin
        Rails.logger.debug "添付ファイル処理中: ID #{attachment.id}, 名前: #{attachment.filename}"
        
        if file_exists?(attachment)
          # 直接ダウンロードエンドポイントのURLを生成
          url = Rails.application.routes.url_helpers.download_attachment_api_v1_task_path(
            object.id, 
            attachment_id: attachment.id
          )
          
          {
            id: attachment.id,
            name: attachment.filename.to_s,
            content_type: attachment.content_type,
            url: url,
            byte_size: attachment.blob.byte_size,
            created_at: attachment.created_at
          }
        else
          # ファイルが見つからない場合はプレースホルダー
          Rails.logger.warn "添付ファイルのBlobデータが見つかりません: ID #{attachment.id}"
          placeholder_image(attachment)
        end
      rescue => e
        Rails.logger.error "添付ファイルURLの生成中にエラーが発生: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        placeholder_image(attachment)
      end
    end
  end
  
  private
  
  # ファイルが実際に存在するかチェック
  def file_exists?(attachment)
    begin
      blob = attachment.blob
      service = ActiveStorage::Blob.service
      
      Rails.logger.debug "[Serializer] file_exists? チェック開始 - Blob Key: #{blob.key}"
      Rails.logger.debug "[Serializer] ストレージサービスの種類: #{service.class.name}"
      
      # サービスごとの存在確認
      if service.is_a?(ActiveStorage::Service::DiskService)
        if service.respond_to?(:path_for)
          path = service.path_for(blob.key)
          Rails.logger.debug "[Serializer] DiskServiceのパス: #{path}"
          exists = File.exist?(path)
          Rails.logger.debug "[Serializer] File.exist?(#{path}): #{exists}"
          # ファイルが存在しても、読み込み可能か確認
          if exists
            begin
              # ファイルを開いて最初の1バイトを読み込む試行
              File.open(path, 'rb') { |f| f.read(1) }
              Rails.logger.debug "[Serializer] ファイル読み込みテスト成功: #{path}"
              return true
            rescue => e
              Rails.logger.error "[Serializer] ファイルは存在するが読み込み不可: #{path}, Error: #{e.message}"
              return false
            end
          else
            return false
          end
        else
          Rails.logger.warn "[Serializer] DiskServiceにpath_forメソッドが存在しません。存在するとみなします。"
          return true # 確認できない場合はtrueを返す
        end
      elsif service.is_a?(ActiveStorage::Service::S3Service)
        begin
          result = service.exist?(blob.key)
          Rails.logger.debug "[Serializer] S3 exist?(#{blob.key}): #{result}"
          return result
        rescue => e
          Rails.logger.error "[Serializer] S3の存在確認で例外が発生: #{e.message}"
          return false
        end
      else
        Rails.logger.info "[Serializer] 未対応のストレージサービス: #{service.class.name}。存在するとみなします。"
        return true
      end
      
    rescue => e
      Rails.logger.error "[Serializer] file_exists?メソッドで予期せぬエラー発生: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      return false
    end
  end
  
  # 欠損ファイル用のプレースホルダー
  def placeholder_image(attachment)
    {
      id: attachment.id,
      name: attachment.filename.to_s,
      content_type: attachment.content_type,
      url: "", # nullではなく空文字列を設定
      error: "ファイルが見つかりません",
      byte_size: 0,
      created_at: attachment.created_at
    }
  end
end 
