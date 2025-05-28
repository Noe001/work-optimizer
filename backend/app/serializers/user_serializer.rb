class UserSerializer < ActiveModel::Serializer
  attributes :id, :name, :email, :department, :position, :bio, :avatarUrl, 
             :role, :status, :display_name, :profile_complete, 
             :paid_leave_balance, :sick_leave_balance,
             :monthly_work_hours, :monthly_overtime_hours,
             :created_at, :updated_at

  # 表示名
  def display_name
    object.display_name
  end

  # プロフィール完成度
  def profile_complete
    object.profile_complete?
  end

  # 有給休暇残日数
  def paid_leave_balance
    object.paid_leave_balance
  end

  # 病気休暇残日数
  def sick_leave_balance
    object.sick_leave_balance
  end

  # 今月の労働時間
  def monthly_work_hours
    object.monthly_work_hours
  end

  # 今月の残業時間
  def monthly_overtime_hours
    object.monthly_overtime_hours
  end

  # 所属組織の情報（必要に応じて）
  def organizations
    object.organizations.map do |org|
      {
        id: org.id,
        name: org.name,
        role: object.organization_memberships.find_by(organization: org)&.role
      }
    end
  end
end 
