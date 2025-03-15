class Goal < ApplicationRecord
  belongs_to :user
  belongs_to :project, optional: true
  
  validates :title, presence: true
  validates :target_value, presence: true, numericality: { greater_than: 0 }
  validates :current_value, presence: true, numericality: { greater_than_or_equal_to: 0 }
  
  enum status: { active: 0, achieved: 1, failed: 2, cancelled: 3 }
  enum category: { productivity: 0, work_life_balance: 1, health: 2, learning: 3, other: 4 }
  
  def progress_percentage
    return 0 if target_value.zero?
    
    percentage = (current_value.to_f / target_value) * 100
    [percentage, 100].min
  end
  
  def days_remaining
    return nil unless deadline
    
    (deadline.to_date - Date.current).to_i
  end
  
  def update_status!
    if progress_percentage >= 100
      self.status = 'achieved'
    elsif deadline.present? && deadline < Time.current && progress_percentage < 100
      self.status = 'failed'
    end
    
    save
  end
end 
