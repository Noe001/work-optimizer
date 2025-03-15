class User < ApplicationRecord
  has_secure_password
  
  has_many :tasks, dependent: :destroy
  has_many :projects, dependent: :destroy
  has_many :goals, dependent: :destroy
  has_many :time_logs, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :team_memberships, dependent: :destroy
  has_many :teams, through: :team_memberships
  has_many :knowledge_base_entries, dependent: :destroy
  has_many :meetings, dependent: :destroy
  has_many :comments, dependent: :destroy
  
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :username, presence: true, uniqueness: true, length: { minimum: 3, maximum: 30 }
  validates :password, presence: true, length: { minimum: 6 }, on: :create
  
  enum role: { user: 0, admin: 1 }
  
  def work_life_balance_score
    # 実際の実装はより複雑になりますが、簡略化したバージョン
    time_logs.where(created_at: 30.days.ago..Time.current).average(:balance_score) || 0
  end
  
  def productivity_score
    # タスク完了率と目標達成率に基づくスコア計算
    completed_tasks = tasks.where(status: 'completed', due_date: 30.days.ago..Time.current).count
    total_tasks = tasks.where(due_date: 30.days.ago..Time.current).count
    
    total_tasks > 0 ? (completed_tasks.to_f / total_tasks) * 100 : 0
  end

  before_create :set_uuid

  private

  def set_uuid
    self.id ||= SecureRandom.uuid
  end
end
