class ManualSerializer
  include JSONAPI::Serializer
  
  attributes :title, :content, :department, :category, :access_level, :edit_permission, :status, :created_at, :updated_at
  
  attribute :author do |manual|
    {
      id: manual.user.id,
      name: manual.user.name
    }
  end
  
  attribute :can_edit do |manual, params|
    current_user = params[:current_user]
    return false unless current_user
    
    case manual.edit_permission
    when 'author'
      manual.user_id == current_user.id
    when 'department'
      manual.department == current_user.department && current_user.department_admin?
    when 'specific'
      # 特定のユーザーに編集権限がある場合の処理
      # この実装はプロジェクトの要件に応じて拡張する必要があります
      manual.user_id == current_user.id
    else
      false
    end
  end
end 
