# JWTのデコードとエンコードに使用する秘密鍵を設定

# 開発環境では常に固定の秘密鍵を使用する
if Rails.env.development?
  # 開発環境用の固定秘密鍵（本番環境では絶対に使用しないでください）
  jwt_key = '3e9d0b957e88e3b43996db6fa7585af1fc5fcd9601e7be27a3f1c5a06a9a2b6e3f45f0e79acbac9256e0784d6d0d1ac1872fcc94bcd8bb3ad74f19dacd232f87'
  
  # アプリケーション全体で使用する秘密鍵として設定
  Rails.application.config.secret_key_base = jwt_key
else
  # 本番環境では環境変数またはcredentialsから秘密鍵を取得
  unless Rails.application.secret_key_base
    puts "WARNING: secret_key_base is not set in production/test environment!"
  end
end

# 環境変数で秘密鍵を上書きする場合（デプロイ時など）
if ENV['JWT_SECRET_KEY'].present?
  Rails.application.config.secret_key_base = ENV['JWT_SECRET_KEY']
end

# JWTの設定を格納するモジュール
module JWTConfig
  # 署名アルゴリズム
  ALGORITHM = 'HS256'
  
  # 秘密鍵を取得するメソッド
  def self.secret_key
    Rails.application.config.secret_key_base.to_s
  end
end 
