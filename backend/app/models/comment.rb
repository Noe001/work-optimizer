class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :commentable, polymorphic: true
  
  validates :content, presence: true
  
  def short_content
    content.truncate(100)
  end
end 
