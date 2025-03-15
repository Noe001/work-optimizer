class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :notifiable, polymorphic: true, optional: true
  
  validates :message, presence: true
  
  enum notification_type: { info: 0, warning: 1, success: 2, error: 3 }
  
  scope :unread, -> { where(read: false) }
  scope :recent, -> { order(created_at: :desc).limit(10) }
  
  def mark_as_read!
    update(read: true)
  end
  
  def short_message
    message.truncate(50)
  end
end 
