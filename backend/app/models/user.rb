class User < ApplicationRecord
  attr_accessor :remember_token, :activation_token, :reset_token

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
  validates :name, presence: true, length: { maximum: 50 }
  VALID_EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i
  validates :email, presence: true, 
                    length: { maximum: 255 },
                    format: { with: VALID_EMAIL_REGEX },
                    uniqueness: { case_sensitive: false }
  validates :password, presence: true, length: { minimum: 6 }, allow_nil: true

  # プロフィールフィールドのバリデーション
  validates :department, length: { maximum: 100 }, allow_blank: true
  validates :position, length: { maximum: 100 }, allow_blank: true
  validates :bio, length: { maximum: 1000 }, allow_blank: true

  # ユーザー登録前にメールアドレスを小文字に変換
  before_save :downcase_email
  before_create :create_activation_digest

  # JWTトークン生成
  def generate_jwt
    # トークン有効期限
    exp_time = 30.days.from_now.to_i
    
    payload = {
      user_id: self.id,
      email: self.email,
      name: self.name,
      exp: exp_time,
      iat: Time.now.to_i
    }
    
    # JWTConfig モジュールを使用して秘密鍵を取得
    secret_key = JWTConfig.secret_key
    
    token = JWT.encode(payload, secret_key, JWTConfig::ALGORITHM)
    
    token
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

  # 渡された文字列のハッシュ値を返す
  def User.digest(string)
    cost = ActiveModel::SecurePassword.min_cost ? BCrypt::Engine::MIN_COST : BCrypt::Engine.cost
    BCrypt::Password.create(string, cost: cost)
  end

  # ランダムなトークンを返す
  def User.new_token
    SecureRandom.urlsafe_base64
  end

  # 永続セッションのためにユーザーをデータベースに記憶する
  def remember
    self.remember_token = User.new_token
    update_attribute(:remember_digest, User.digest(remember_token))
  end

  # トークンがダイジェストと一致したらtrueを返す
  def authenticated?(attribute, token)
    digest = send("#{attribute}_digest")
    return false if digest.nil?
    BCrypt::Password.new(digest).is_password?(token)
  end

  # ユーザーのログイン情報を破棄する
  def forget
    update_attribute(:remember_digest, nil)
  end

  # アカウントを有効にする
  def activate
    update_columns(activated: true, activated_at: Time.zone.now)
  end

  # 有給休暇の残日数を取得
  def paid_leave_balance
    # 実際の計算ロジックはここに実装
    # ここでは仮の値を返す
    15
  end

  # 病気休暇の残日数を取得
  def sick_leave_balance
    # 実際の計算ロジックはここに実装
    # ここでは仮の値を返す
    5
  end

  # 今日の勤怠記録を取得
  def today_attendance
    attendances.find_by(date: Date.current)
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

  # 有効化トークンとダイジェストを作成および代入する
  def create_activation_digest
    self.activation_token = User.new_token
    self.activation_digest = User.digest(activation_token)
  end
end
