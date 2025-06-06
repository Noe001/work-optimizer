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
