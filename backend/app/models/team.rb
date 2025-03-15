class Team < ApplicationRecord
  has_many :team_memberships, dependent: :destroy
  has_many :users, through: :team_memberships
  has_many :projects, dependent: :nullify
  has_many :meetings, dependent: :destroy
  
  validates :name, presence: true
  
  def members_count
    users.count
  end
  
  def owner
    team_memberships.find_by(role: 'owner')&.user
  end
  
  def active_projects_count
    projects.where(status: 'active').count
  end
  
  def productivity_score
    # チームのプロジェクト進捗状況に基づくスコア計算
    completed_tasks = projects.joins(:tasks).where(tasks: { status: 'completed' }).count
    total_tasks = projects.joins(:tasks).count
    
    total_tasks > 0 ? (completed_tasks.to_f / total_tasks) * 100 : 0
  end
end 
