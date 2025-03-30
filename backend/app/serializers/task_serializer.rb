class TaskSerializer < ActiveModel::Serializer
  attributes :id, :title, :description, :status, :priority, :due_date, :assigned_to, 
             :created_at, :updated_at, :user_id, :tag_list, :assignee_name,
             :organization_id, :organization_name, :is_overdue, :is_completed, :time_remaining, :attachment_urls

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
    
    object.attachments.map do |attachment|
      {
        id: attachment.id,
        name: attachment.filename.to_s,
        url: Rails.application.routes.url_helpers.rails_blob_url(attachment, only_path: true)
      }
    end
  end
end 
