class TaskSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers
  
  attributes :id, :title, :description, :status, :priority, :due_date, :assigned_to, 
             :created_at, :updated_at, :tag_list, :assignee_name,
             :organization_id, :organization_name, :is_overdue, :is_completed, :time_remaining, :attachment_urls
  has_one :user
  has_many :comments
  has_many :task_tags
  has_many :tags, through: :task_tags

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
    Rails.logger.debug "TaskSerializer#attachment_urls called for task #{object.id}"
    return [] unless object.attachments.attached?
    
    Rails.logger.debug "Task has #{object.attachments.count} attachments"
    
    object.attachments.map do |attachment|
      blob = attachment.blob
      filename = attachment.filename.to_s
      Rails.logger.debug "Processing attachment: #{filename}, blob_id: #{blob.id}, key: #{blob.key}"
      
      # ファイル存在チェック
      disk_path = ActiveStorage::Blob.service.path_for(blob.key)
      file_exists = File.exist?(disk_path)
      Rails.logger.debug "Checking file existence at path: #{disk_path}, exists: #{file_exists}"
      
      # コンテンツタイプ情報を取得
      content_type = blob.content_type
      Rails.logger.debug "Content-Type: #{content_type}"
      
      # ファイルが存在しない場合はデバッグ情報を追加
      unless file_exists
        Rails.logger.error "File not found on disk: #{disk_path} for blob key: #{blob.key}, id: #{blob.id}"
        Rails.logger.debug "Blob metadata: #{blob.attributes}"
      end
      
      # 基本情報を先に構築
      url_info = {
        id: attachment.id,
        name: filename,
        content_type: content_type,
        blob_id: blob.id,
        blob_key: blob.key,
        blob_signed_id: blob.signed_id,
        created_at: blob.created_at,
        file_exists: file_exists
      }
      
      # ファイルが存在しない場合はフォールバック画像を使用
      if !file_exists
        # イメージファイルの場合は "no-image-available.png" を使用
        if content_type&.start_with?('image/')
          url_info[:url] = "http://localhost:3000/images/no-image-available.png"
          url_info[:error] = "File not found on disk"
          url_info[:error_info] = "Original path: #{disk_path}"
          return url_info
        else
          # その他のファイルタイプの場合は別のアイコンを使用
          url_info[:url] = "http://localhost:3000/images/file-not-found.png"
          url_info[:error] = "File not found on disk"
          url_info[:error_info] = "Original path: #{disk_path}"
          return url_info
        end
      end
      
      # ファイルが存在する場合は通常のURL生成を試みる
      begin
        # 直接プロキシアクセスURLを生成（Rails 7の推奨方法）
        url = if Rails.env.development?
          # 開発環境では localhost:3000 を使用
          host = "localhost:3000"
          Rails.application.routes.url_helpers.rails_blob_url(blob, host: host)
        else
          # 本番環境では設定されたホストを使用
          host = Rails.application.config.action_mailer.default_url_options[:host]
          Rails.application.routes.url_helpers.rails_blob_url(blob, host: host)
        end
        
        Rails.logger.debug "Generated URL: #{url}"
        url_info[:url] = url
        
        # Content-Length エラーに対処するため、小さなファイルの場合はBase64でエンコード
        if file_exists && content_type&.start_with?('image/') && File.size(disk_path) < 1.megabyte
          begin
            Rails.logger.debug "Small image detected, generating base64 data URL"
            file_content = File.binread(disk_path)
            base64_data = Base64.strict_encode64(file_content)
            url_info[:data_url] = "data:#{content_type};base64,#{base64_data}"
          rescue => e
            Rails.logger.error "Failed to generate base64 data URL: #{e.message}"
          end
        end
        
        return url_info
      rescue => e
        Rails.logger.error "Error generating URL for attachment #{attachment.id}: #{e.message}"
        url_info[:error] = e.message
        
        # エラー時はblobのkeyやsigned_idを使用した代替URLを試す
        begin
          # 代替URL生成ロジック
          alternate_url = rails_blob_path(blob, disposition: :attachment)
          Rails.logger.debug "Generated alternate URL: #{alternate_url}"
          url_info[:url] = alternate_url
        rescue => e2
          Rails.logger.error "Failed to generate alternate URL: #{e2.message}"
          url_info[:error_info] = e2.message
          url_info[:url] = "http://localhost:3000/images/error-loading-file.png"
        end
        
        return url_info
      end
    end
  end
end 
