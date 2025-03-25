class Invitation < ApplicationRecord
  belongs_to :organization

  # バリデーション
  validates :code, presence: true, uniqueness: true
  validates :uses_allowed, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :uses_count, numericality: { greater_than_or_equal_to: 0 }

  # 招待リンクが有効かどうか
  def valid_for_use?
    return false if expired?
    return true if uses_allowed.nil?
    uses_count < uses_allowed
  end

  # 使用回数をカウントアップ
  def increment_usage!
    update(uses_count: uses_count + 1)
  end

  # 有効期限が切れているかどうか
  def expired?
    expires_at.present? && expires_at < Time.current
  end

  # 永久招待コードを作成
  def self.create_permanent(organization, created_by)
    create(
      organization: organization,
      code: generate_unique_code,
      created_by: created_by,
      uses_count: 0
    )
  end

  # 期限付き招待コードを作成
  def self.create_with_expiry(organization, created_by, expires_in_hours = 24, uses_allowed = nil)
    create(
      organization: organization,
      code: generate_unique_code,
      expires_at: Time.current + expires_in_hours.hours,
      created_by: created_by,
      uses_allowed: uses_allowed,
      uses_count: 0
    )
  end

  private

  def self.generate_unique_code
    loop do
      code = "#{SecureRandom.alphanumeric(10).upcase}"
      break code unless exists?(code: code)
    end
  end
end 
