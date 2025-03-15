class Meeting < ApplicationRecord
  belongs_to :user
  belongs_to :team, optional: true
  
  has_many :meeting_participants, dependent: :destroy
  has_many :participants, through: :meeting_participants, source: :user
  has_many :comments, as: :commentable, dependent: :destroy
  
  validates :title, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  
  validate :end_time_after_start_time
  
  enum status: { scheduled: 0, in_progress: 1, completed: 2, cancelled: 3 }
  
  scope :upcoming, -> { where('start_time > ?', Time.current).order(start_time: :asc) }
  scope :past, -> { where('end_time < ?', Time.current).order(start_time: :desc) }
  scope :today, -> { where('DATE(start_time) = ?', Date.current) }
  
  def duration_minutes
    ((end_time - start_time) / 60).to_i
  end
  
  def is_online?
    meeting_url.present?
  end
  
  def add_participant(user)
    meeting_participants.create(user: user)
  end
  
  private
  
  def end_time_after_start_time
    return if end_time.blank? || start_time.blank?
    
    if end_time <= start_time
      errors.add(:end_time, "must be after the start time")
    end
  end
end
