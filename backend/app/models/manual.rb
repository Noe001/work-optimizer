class Manual < ApplicationRecord
  before_create :set_uuid
  belongs_to :user

  # 状態を定義（文字列ベースのenum）
  enum status: {
    draft: 'draft',
    published: 'published'
  }

  # 部門を定義（文字列ベースのenum）
  enum department: {
    sales: 'sales',
    dev: 'dev',
    hr: 'hr'
  }

  # カテゴリーを定義（文字列ベースのenum）
  enum category: {
    procedure: 'procedure',
    rules: 'rules',
    system: 'system'
  }

  # アクセスレベルを定義（文字列ベースのenum）
  enum access_level: {
    all: 'all',
    department: 'department',
    specific: 'specific'
  }, _prefix: 'access'

  # 編集権限を定義（文字列ベースのenum）
  enum edit_permission: {
    author: 'author',
    department: 'department',
    specific: 'specific'
  }, _prefix: 'edit'

  # バリデーション
  validates :title, presence: true
  validates :department, presence: true
  validates :category, presence: true
  validates :access_level, presence: true
  validates :edit_permission, presence: true
  validates :status, presence: true

  # デフォルトのスコープとして公開中のマニュアルを取得
  scope :published, -> { where(manuals: { status: 'published' }) }
  
  # 特定のユーザーがアクセスできるマニュアルを取得するスコープ
  scope :accessible_by, ->(user) {
    if user.nil?
      none
    else
      where(
        '(manuals.user_id = ?) OR (manuals.status = ? AND (manuals.access_level = ? OR (manuals.access_level = ? AND manuals.department = ?) OR (manuals.access_level = ? AND manuals.user_id = ?)))',
        user.id,  # 自分が作成したマニュアル（下書き含む）
        'published',  # 公開済みマニュアルの場合
        'all',  # 全社員アクセス可能
        'department', user.department.to_s,  # 同じ部門
        'specific', user.id  # 特定ユーザー指定
      )
    end
  }

  private

  # UUID生成
  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end
end
