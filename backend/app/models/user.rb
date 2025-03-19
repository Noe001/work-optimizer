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
    
    # トークン生成のログ
    if Rails.env.development?
      puts "Generating JWT token for user:"
      puts "  ID: #{self.id}"
      puts "  Email: #{self.email}"
      puts "  Expiration: #{Time.at(exp_time).iso8601}"
    end
    
    token = JWT.encode(payload, Rails.application.credentials.secret_key_base, 'HS256')
    
    # 開発環境のみログ出力
    if Rails.env.development?
      puts "Generated JWT token: #{token[0..15]}..."
    end
    
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

  def set_uuid
    self.id ||= SecureRandom.uuid
  end

  def downcase_email
    self.email = email.downcase
  end
end
