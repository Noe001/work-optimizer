class MeetingParticipant < ApplicationRecord
  # リレーションシップ
  belongs_to :meeting
  belongs_to :user
  
  # バリデーション
  validates :user_id, uniqueness: { scope: :meeting_id, message: "は既にこのミーティングに参加しています" }
end 
