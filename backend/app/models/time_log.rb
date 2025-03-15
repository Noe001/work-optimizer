class TimeLog < ApplicationRecord
  belongs_to :user
  belongs_to :task, optional: true
  
  validates :duration, presence: true, numericality: { greater_than: 0 }
  validates :started_at, presence: true
  
  before_validation :calculate_duration, if: -> { started_at.present? && ended_at.present? && duration.nil? }
  
  scope :today, -> { where('DATE(started_at) = ?', Date.current) }
  scope :this_week, -> { where('started_at >= ? AND started_at <= ?', Date.current.beginning_of_week, Date.current.end_of_week) }
  scope :this_month, -> { where('started_at >= ? AND started_at <= ?', Date.current.beginning_of_month, Date.current.end_of_month) }
  
  def calculate_duration
    self.duration = ((ended_at - started_at) /.seconds_per_minute).round
  end
  
  def formatted_duration
    hours = duration / 60
    minutes = duration % 60
    
    "#{hours}時間#{minutes}分"
  end
end 
