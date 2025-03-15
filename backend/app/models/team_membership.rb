class TeamMembership < ApplicationRecord
  belongs_to :user
  belongs_to :team
  
  validates :user_id, uniqueness: { scope: :team_id, message: 'is already a member of this team' }
  
  enum role: { member: 0, manager: 1, owner: 2 }
  
  def is_admin?
    role == 'manager' || role == 'owner'
  end
end 
