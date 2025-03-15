class Project < ApplicationRecord
  belongs_to :user
  belongs_to :team, optional: true
  
  has_many :tasks, dependent: :destroy
  has_many :comments, as: :commentable, dependent: :destroy
  has_many :goals, dependent: :destroy
  
  validates :name, presence: true
  
  enum status: { planning: 0, active: 1, completed: 2, on_hold: 3, cancelled: 4 }
  
  def completion_percentage
    total_tasks = tasks.count
    return 0 if total_tasks.zero?
    
    completed_tasks = tasks.completed.count
    (completed_tasks.to_f / total_tasks) * 100
  end
  
  def time_spent
    tasks.joins(:time_logs).sum('time_logs.duration')
  end
  
  def days_until_deadline
    return nil unless deadline
    
    (deadline.to_date - Date.current).to_i
  end
  
  def is_overdue?
    deadline.present? && deadline < Time.current && status != 'completed'
  end
end 
