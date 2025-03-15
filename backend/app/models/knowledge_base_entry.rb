class KnowledgeBaseEntry < ApplicationRecord
  belongs_to :user
  belongs_to :category, class_name: 'KnowledgeBaseCategory', optional: true
  
  has_many :comments, as: :commentable, dependent: :destroy
  
  validates :title, presence: true
  validates :content, presence: true
  
  enum visibility: { private: 0, team: 1, public: 2 }
  
  scope :searchable, ->(current_user) {
    where("visibility = 2 OR (visibility = 1 AND team_id IN (?))", current_user.team_ids)
      .or(where(user_id: current_user.id))
  }
  
  def short_content
    content.truncate(200)
  end
  
  def reading_time
    # 平均的な読書速度を1分あたり400単語と仮定
    words = content.split.size
    minutes = (words / 400.0).ceil
    
    minutes > 1 ? "#{minutes}分" : "1分未満"
  end
end 
