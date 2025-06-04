class ManualSerializer < ActiveModel::Serializer
  attributes :id, :title, :content, :department, :category, :access_level, :edit_permission, :status, :created_at, :updated_at, :tags, :author, :can_edit
  
  def access_level
    object.access_level
  end
  
  def edit_permission
    object.edit_permission
  end
  
  def author
    if object.user.present?
      {
        id: object.user.id,
        name: object.user.name
      }
    else
      {
        id: nil,
        name: '不明なユーザー'
      }
    end
  end
  
  def can_edit
    current_user = instance_options[:current_user]
    return false unless current_user
    
    begin
      if object.edit_author?
        object.user_id == current_user.id
      elsif object.edit_department?
        object.department == current_user.department && current_user.department_admin?
      elsif object.edit_specific?
        # 特定のユーザーに編集権限がある場合の処理
        # この実装はプロジェクトの要件に応じて拡張する必要があります
        object.user_id == current_user.id
      else
        false
      end
    rescue => e
      Rails.logger.error "can_edit calculation error: #{e.class} - #{e.message}"
      false
    end
  end
end 
