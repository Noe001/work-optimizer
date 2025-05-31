class Manual < ApplicationRecord
  before_create :set_uuid
  belongs_to :user

  # 状態を定義
  enum status: {
    draft: 'draft',      # 下書き
    published: 'published' # 公開済み
  }, _default: 'draft'

  # 部門を定義
  enum department: {
    sales: 'sales',  # 営業部
    dev: 'dev',      # 開発部
    hr: 'hr'         # 人事部
  }

  # カテゴリーを定義
  enum category: {
    procedure: 'procedure', # 業務手順
    rules: 'rules',         # 規則・規定
    system: 'system'        # システム操作
  }

  # アクセスレベルを定義
  enum access_level: {
    all_users: 'all',        # 全社員
    department: 'department', # 部門内
    specific: 'specific'      # 指定メンバーのみ
  }

  # 編集権限を定義
  enum edit_permission: {
    author_only: 'author',         # 作成者のみ
    dept_admin: 'department',      # 部門管理者
    specific_users: 'specific'     # 指定メンバー
  }

  # バリデーション
  validates :title, presence: true
  validates :department, presence: true
  validates :category, presence: true
  validates :access_level, presence: true
  validates :edit_permission, presence: true
  validates :status, presence: true

  # デフォルトのスコープとして公開中のマニュアルを取得
  scope :published, -> { where(status: 'published') }
  
  # 特定のユーザーがアクセスできるマニュアルを取得するスコープ
  scope :accessible_by, ->(user) {
    if user.nil?
      none
    else
      where(
        'status = ? AND (access_level = ? OR (access_level = ? AND department = ?) OR (access_level = ? AND user_id = ?))',
        'published',
        'all',
        'department', user.department,
        'specific', user.id
      )
    end
  }

  private

  # UUID生成
  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end
end
