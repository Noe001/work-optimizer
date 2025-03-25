class User < ApplicationRecord
  before_create :set_uuid
  has_secure_password

  # リレーションシップ
  has_many :organization_memberships, dependent: :destroy
  has_many :organizations, through: :organization_memberships
  has_many :tasks, foreign_key: 'assigned_to', dependent: :nullify
  has_many :meeting_participants, dependent: :destroy
  has_many :meetings, through: :meeting_participants
  has_many :organized_meetings, class_name: 'Meeting', foreign_key: 'organizer_id', dependent: :nullify

  # バリデーション
  validates :name, presence: true, length: { maximum: 50 }
  validates :email, presence: true, 
                    length: { maximum: 255 },
                    format: { with: URI::MailTo::EMAIL_REGEXP },
                    uniqueness: { case_sensitive: false }
  validates :password, presence: true, length: { minimum: 6 }, allow_nil: true

  # ユーザー登録前にメールアドレスを小文字に変換
  before_save :downcase_email

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
