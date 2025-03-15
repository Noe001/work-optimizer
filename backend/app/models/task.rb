class Task < ApplicationRecord
  belongs_to :user
  belongs_to :project, optional: true
  has_many :comments, as: :commentable, dependent: :destroy
  has_many :time_logs, dependent: :destroy
  
  validates :title, presence: true
  validates :priority, presence: true
  
  enum status: { not_started: 0, in_progress: 1, completed: 2, cancelled: 3 }
  enum priority: { low: 0, medium: 1, high: 2, urgent: 3 }
  
  scope :upcoming, -> { where('due_date >= ?', Time.current).order(due_date: :asc) }
  scope :overdue, -> { where('due_date < ? AND status != ?', Time.current, statuses[:completed]) }
  
  def completion_percentage
    case status
    when 'not_started' then 0
    when 'in_progress' then 50
    when 'completed' then 100
    when 'cancelled' then 0
    end
  end
  
  def is_overdue?
    due_date.present? && due_date < Time.current && status != 'completed'
  end
  
  def time_spent
    time_logs.sum(:duration)
  end
end 
