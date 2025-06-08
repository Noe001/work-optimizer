class User < ApplicationRecord
  before_create :set_uuid
  has_secure_password

  # リレーションシップ
  has_many :organization_memberships, dependent: :destroy
  has_many :organizations, through: :organization_memberships
  has_many :received_invitations, class_name: 'Invitation', foreign_key: 'recipient_id', dependent: :destroy
  has_many :sent_invitations, class_name: 'Invitation', foreign_key: 'sender_id', dependent: :destroy
  has_many :tasks, foreign_key: 'assigned_to', dependent: :nullify
  has_many :meeting_participants, dependent: :destroy
  has_many :meetings, through: :meeting_participants
  has_many :organized_meetings, class_name: 'Meeting', foreign_key: 'organizer_id', dependent: :nullify
  has_many :attendances, dependent: :destroy
  has_many :leave_requests, dependent: :destroy

  # バリデーション
  validates :name, presence: true, length: { in: 2..50 }
  VALID_EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i
  validates :email, presence: true, 
                    length: { maximum: 255 },
                    format: { with: VALID_EMAIL_REGEX },
                    uniqueness: { case_sensitive: false }
  validates :password, presence: true, length: { minimum: 8 }, allow_nil: true

  # プロフィールフィールドのバリデーション
  validates :department, length: { maximum: 100 }, allow_blank: true
  validates :position, length: { maximum: 100 }, allow_blank: true
  validates :bio, length: { maximum: 1000 }, allow_blank: true

  # ユーザー登録前にメールアドレスを小文字に変換
  before_save :downcase_email

  # JWTトークン生成
  def generate_jwt
    # トークン有効期限
    exp_time = JWTConfig.expiration_time.from_now.to_i
    
    payload = {
      user_id: self.id,
      email: self.email,
      name: self.name,
      exp: exp_time,
      iat: Time.now.to_i
    }
    
    secret_key = JWTConfig.secret_key
    JWT.encode(payload, secret_key, JWTConfig::ALGORITHM)
  end

  # ユーザーが所属する組織を作成するメソッド
  def create_organization(name, description = '')
    organization = Organization.create!(name: name, description: description)
    organization.add_admin(self)
    organization
  end

  # ユーザーが組織に参加するメソッド
  def join_organization(organization, role = 'member')
    organization.add_member(self, role)
  end

  # 表示名を取得
  def display_name
    name.presence || email.split('@').first
  end

  # フルネーム（将来的に姓名を分ける場合に備えて）
  def full_name
    name
  end

  # プロフィールが完成しているかチェック
  def profile_complete?
    name.present? && email.present? && department.present? && position.present?
  end

  # 有給休暇の残日数を取得
  def paid_leave_balance
    # 実際の計算ロジックはここに実装
    # 年間付与日数から使用済み日数を引く
    annual_leave_days = 20 # 基本付与日数
    used_days = leave_requests.where(
      leave_type: 'paid_leave', 
      status: 'approved',
      start_date: Date.current.beginning_of_year..Date.current.end_of_year
    ).sum { |req| (req.end_date - req.start_date + 1).to_i }
    
    [annual_leave_days - used_days, 0].max
  end

  # 病気休暇の残日数を取得
  def sick_leave_balance
    # 実際の計算ロジックはここに実装
    annual_sick_days = 10 # 基本付与日数
    used_days = leave_requests.where(
      leave_type: 'sick_leave', 
      status: 'approved',
      start_date: Date.current.beginning_of_year..Date.current.end_of_year
    ).sum { |req| (req.end_date - req.start_date + 1).to_i }
    
    [annual_sick_days - used_days, 0].max
  end

  # 今日の勤怠記録を取得
  def today_attendance
    attendances.find_by(date: Date.current)
  end

  # 今月の総労働時間を取得
  def monthly_work_hours
    attendances.where(
      date: Date.current.beginning_of_month..Date.current.end_of_month
    ).sum(:total_hours) || 0
  end

  # 今月の残業時間を取得
  def monthly_overtime_hours
    attendances.where(
      date: Date.current.beginning_of_month..Date.current.end_of_month
    ).sum(:overtime_hours) || 0
  end

  # 権限管理メソッド群
  
  # システム管理者かどうかを判定
  def system_admin?
    system_admin || role == 'admin'
  end
  
  # 組織管理者かどうかを判定  
  def organization_admin?
    organization_admin || system_admin?
  end
  
  # 部門管理者かどうかを判定
  # 新しい権限フラグを優先し、フォールバックとしてレガシー実装を保持
  def department_admin?
    # 1. 新しい権限フラグをチェック（最優先）
    return true if department_admin
    
    # 2. システム管理者は全権限を持つ
    return true if system_admin?
    
    # 3. 明示的なロールチェック
    return true if role.in?(['admin', 'department_manager', 'department_admin'])
    
    # 4. レガシー実装（段階的廃止予定）
    # DEPRECATION WARNING: この部分は将来的に削除されます
    Rails.logger.warn "[DEPRECATION] position-based admin detection used for user #{id}. Please update to use department_admin flag."
    
    return false unless position.present?
    
    # 厳格な役職名チェック（ホワイトリスト方式）
    admin_positions = [
      '部長', '課長', '室長', '所長', 'マネージャー', 'manager',
      'department manager', 'section manager', 'division manager'
    ]
    
    normalized_position = position.strip.downcase
    admin_positions.any? { |admin_pos| normalized_position == admin_pos.downcase }
  end
  
  # 特定のリソースに対する権限チェック（将来のRBACに向けた準備）
  def can_manage?(resource_type, scope = :own)
    case scope
    when :system
      system_admin?
    when :organization  
      organization_admin?
    when :department
      department_admin? || organization_admin?
    when :own
      true # 基本的に自分のリソースは管理可能
    else
      false
    end
  end

  # TODO: 将来的な権限管理システムの改善案
  # 1. 専用のPermissionテーブルを作成
  # 2. CanCanCan/Punditなどの認可ライブラリの導入
  # 3. 部門管理者フラグ(department_admin)カラムの追加
  # 4. Role-Based Access Control (RBAC)の実装
  #
  # 改善例:
  # def department_admin?
  #   department_admin || has_role?(:department_manager, department)
  # end

  private

  # メールアドレスを小文字に変換
  def downcase_email
    self.email = email.downcase
  end

  # UUID生成
  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end
end
