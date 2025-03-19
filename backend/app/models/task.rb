class Task < ApplicationRecord
  belongs_to :user

  # ステータスと優先度の定数
  STATUSES = ['pending', 'in_progress', 'completed'].freeze
  PRIORITIES = ['low', 'medium', 'high'].freeze

  # バリデーション
  validates :title, presence: true
  validates :status, inclusion: { in: STATUSES }, allow_nil: true
  validates :priority, inclusion: { in: PRIORITIES }, allow_nil: true
  
  # タグの取得と設定
  def tag_list
    tags.present? ? tags.split(',') : []
  end

  def tag_list=(tags_array)
    self.tags = tags_array.join(',')
  end

  # スコープ
  scope :pending, -> { where(status: 'pending') }
  scope :in_progress, -> { where(status: 'in_progress') }
  scope :completed, -> { where(status: 'completed') }
  scope :high_priority, -> { where(priority: 'high') }
  scope :due_soon, -> { where('due_date <= ?', 7.days.from_now) }
  scope :overdue, -> { where('due_date < ? AND status != ?', Date.current, 'completed') }
  scope :recent, -> { order(created_at: :desc) }
end 
