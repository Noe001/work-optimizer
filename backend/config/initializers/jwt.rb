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
    key = Rails.application.credentials.jwt_secret_key || 
          ENV['JWT_SECRET_KEY'] || 
          Rails.application.config.secret_key_base
    
    raise 'JWT secret key is not configured' if key.blank?
    key.to_s
  end
  
  # トークンの有効期限を取得
  def self.expiration_time
    ENV.fetch('JWT_EXPIRATION_HOURS', 24).to_i.hours
  end
  
  # リフレッシュトークンの有効期限
  def self.refresh_expiration_time
    ENV.fetch('JWT_REFRESH_EXPIRATION_DAYS', 7).to_i.days
  end
  
  # トークンをデコード
  def self.decode(token)
    JWT.decode(token, secret_key, true, { algorithm: ALGORITHM })
  rescue JWT::DecodeError => e
    Rails.logger.error "JWT decode error: #{e.message}"
    nil
  end
  
  # トークンの有効性をチェック
  def self.valid_token?(token)
    decoded = decode(token)
    return false unless decoded
    
    payload = decoded.first
    exp_time = Time.at(payload['exp'])
    exp_time > Time.current
  rescue
    false
  end
end 
