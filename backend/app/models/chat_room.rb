class ChatRoom < ApplicationRecord
  before_create :set_uuid
  after_update :clear_cache
  after_destroy :clear_cache
  
  # リレーションシップ
  has_many :messages, dependent: :destroy
  has_many :chat_room_memberships, dependent: :destroy
  has_many :users, through: :chat_room_memberships
  
  # バリデーション
  validates :name, presence: true, if: -> { !is_direct_message }
  validates :name, length: { maximum: 100 }
  
  # スコープ
  scope :direct_messages, -> { where(is_direct_message: true) }
  scope :group_chats, -> { where(is_direct_message: false) }
  scope :accessible_by, ->(user) { joins(:chat_room_memberships).where(chat_room_memberships: { user: user }) }
  
  # ダイレクトメッセージルームを取得または作成
  def self.direct_message_for_users(user_ids)
    raise "ダイレクトメッセージには2人のユーザーが必要です" unless user_ids.size == 2
    
    user_ids = user_ids.sort
    
    # 既存のダイレクトメッセージルームを検索
    chat_rooms = ChatRoom.direct_messages.joins(:chat_room_memberships)
                         .where(chat_room_memberships: { user_id: user_ids })
                         .group('chat_rooms.id')
                         .having('COUNT(DISTINCT chat_room_memberships.user_id) = ?', user_ids.size)
    
    # 既存のルームがあれば返す
    existing_room = chat_rooms.find do |room|
      room.users.pluck(:id).sort == user_ids
    end
    
    return existing_room if existing_room
    
    # 新しいダイレクトメッセージルームを作成
    ChatRoom.create_direct_message(user_ids)
  end
  
  # 新しいダイレクトメッセージルームを作成
  def self.create_direct_message(user_ids)
    ActiveRecord::Base.transaction do
      room = ChatRoom.create!(
        name: "DM",
        is_direct_message: true
      )
      
      # メンバーシップを作成
      user_ids.each do |user_id|
        ChatRoomMembership.create!(chat_room: room, user_id: user_id)
      end
      
      room
    end
  end
  
  # ユーザーがこのチャットルームにアクセス可能かチェック
  def accessible_by?(user)
    return false unless user
    
    Rails.cache.fetch("chat_room_#{id}_accessible_by_#{user.id}", expires_in: 5.minutes) do
      users.exists?(id: user.id)
    end
  end
  
  # キャッシュされたユーザー一覧
  def cached_users
    Rails.cache.fetch("chat_room_#{id}_users", expires_in: 5.minutes) do
      users.select(:id, :name, :email).to_a
    end
  end
  
  # キャッシュされた最新メッセージ
  def cached_last_message
    Rails.cache.fetch("chat_room_#{id}_last_message", expires_in: 1.minute) do
      messages.includes(:user).order(created_at: :desc).first
    end
  end
  
  # 未読メッセージ数（特定ユーザー用）
  def unread_count_for(user)
    return 0 unless user
    
    Rails.cache.fetch("chat_room_#{id}_unread_count_#{user.id}", expires_in: 30.seconds) do
      messages.where.not(user: user).where(read: false).count
    end
  end
  
  # チャットルームの統計情報
  def stats
    Rails.cache.fetch("chat_room_#{id}_stats", expires_in: 10.minutes) do
      {
        total_messages: messages.count,
        total_members: users.count,
        created_at: created_at,
        last_activity: messages.maximum(:created_at) || created_at
      }
    end
  end
  
  # オンラインユーザー数（Action Cable接続数から推定）
  def online_users_count
    # Action Cableの接続情報から推定
    # 実装は環境に依存するため、ここでは簡易版
    Rails.cache.fetch("chat_room_#{id}_online_count", expires_in: 30.seconds) do
      # 実際の実装では Action Cable の接続情報を使用
      users.count # 仮の実装
    end
  end
  
  private
  
  # UUID生成
  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end
  
  # キャッシュクリア
  def clear_cache
    Rails.cache.delete_matched("chat_room_#{id}_*")
  end
end
