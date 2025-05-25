class ChatRoom < ApplicationRecord
  before_create :set_uuid
  
  # リレーションシップ
  has_many :messages, dependent: :destroy
  has_many :chat_room_memberships, dependent: :destroy
  has_many :users, through: :chat_room_memberships
  
  # バリデーション
  validates :name, presence: true, if: -> { !is_direct_message }
  
  # スコープ
  scope :direct_messages, -> { where(is_direct_message: true) }
  scope :group_chats, -> { where(is_direct_message: false) }
  
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
  
  private
  
  # UUID生成
  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end
end
