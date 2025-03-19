class TaskSerializer < ActiveModel::Serializer
  attributes :id, :title, :description, :status, :priority, :due_date, :assigned_to, 
             :created_at, :updated_at, :user_id, :tag_list, :assignee_name

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
end 
