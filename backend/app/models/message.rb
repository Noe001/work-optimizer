class Message < ApplicationRecord
  before_create :set_uuid
  
  # リレーションシップ
  belongs_to :chat_room
  belongs_to :user
  
  # ActiveStorage
  has_one_attached :attachment
  
  # バリデーション
  validates :content, presence: true, unless: -> { attachment.attached? }
  
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
end
