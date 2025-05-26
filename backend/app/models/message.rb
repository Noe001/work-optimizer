class Message < ApplicationRecord
  before_create :set_uuid
  before_save :sanitize_content
  
  # リレーションシップ
  belongs_to :chat_room
  belongs_to :user
  
  # ActiveStorage
  has_one_attached :attachment
  
  # バリデーション
  validates :content, presence: true, unless: -> { attachment.attached? }
  validates :content, length: { maximum: 2000 }
  validate :attachment_validation
  
  # スコープ
  scope :recent, -> { order(created_at: :desc) }
  
  # メッセージを既読にする
  def mark_as_read(user)
    return if user.id == self.user_id # 自分のメッセージは既読にしない
    
    update(read: true, read_at: Time.current) unless read?
  end
  
  # JSONシリアライズ用のメソッド
  def as_json(options = {})
    super(options).merge(
      user_name: user.name,
      attachment_url: attachment.attached? ? Rails.application.routes.url_helpers.custom_blob_proxy_path(
        signed_id: attachment.blob.signed_id,
        filename: attachment.blob.filename
      ) : nil
    )
  end
  
  private
  
  # UUID生成
  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end
  
  # HTMLサニタイゼーション
  def sanitize_content
    if content.present?
      self.content = ActionController::Base.helpers.sanitize(
        content,
        tags: %w[b i em strong u],
        attributes: []
      )
    end
  end
  
  # ファイル検証
  def attachment_validation
    return unless attachment.attached?
    
    # ファイルサイズ制限（10MB）
    if attachment.blob.byte_size > 10.megabytes
      errors.add(:attachment, 'ファイルサイズは10MB以下にしてください')
    end
    
    # ファイル形式制限
    allowed_types = %w[
      image/jpeg image/png image/gif image/webp
      application/pdf
      text/plain text/csv
      application/msword
      application/vnd.openxmlformats-officedocument.wordprocessingml.document
      application/vnd.ms-excel
      application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    ]
    
    unless allowed_types.include?(attachment.blob.content_type)
      errors.add(:attachment, '許可されていないファイル形式です')
    end
    
    # ファイル名の検証
    if attachment.blob.filename.to_s.length > 255
      errors.add(:attachment, 'ファイル名が長すぎます')
    end
    
    # 悪意のあるファイル名の検証
    dangerous_patterns = [/\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.vbs$/i]
    if dangerous_patterns.any? { |pattern| attachment.blob.filename.to_s.match?(pattern) }
      errors.add(:attachment, '危険なファイル形式です')
    end
  end
end
