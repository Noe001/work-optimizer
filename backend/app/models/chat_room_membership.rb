class ChatRoomMembership < ApplicationRecord
  # リレーションシップ
  belongs_to :chat_room
  belongs_to :user
  
  # バリデーション
  validates :user_id, uniqueness: { scope: :chat_room_id }
  validates :role, inclusion: { in: %w(member admin) }
  
  # スコープ
  scope :admins, -> { where(role: 'admin') }
  scope :members, -> { where(role: 'member') }
  
  # 管理者かどうか
  def admin?
    role == 'admin'
  end
end
