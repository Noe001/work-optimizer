class MeetingParticipant < ApplicationRecord
  belongs_to :user
  belongs_to :meeting
  
  validates :user_id, uniqueness: { scope: :meeting_id, message: 'is already a participant of this meeting' }
  
  enum status: { pending: 0, accepted: 1, declined: 2 }
  
  def accept!
    update(status: 'accepted')
  end
  
  def decline!
    update(status: 'declined')
  end
end 
