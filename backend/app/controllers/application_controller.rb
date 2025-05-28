class ApplicationController < ActionController::API
  include ActionController::Cookies
  attr_reader :current_user

  private

  # セッションからユーザーを取得
  def current_user_from_session
    if session[:user_id]
      @current_user ||= User.find_by(id: session[:user_id])
    end
  end

  # セッションベースの認証
  def authenticate_user_from_session
    current_user_from_session || authentication_error
  end

  # リクエストからJWTトークンを取得し、ユーザーを認証する
  def authenticate_user
    # まずセッションから認証を試みる
    if current_user_from_session
      @current_user = current_user_from_session
      return true
    end

    header = request.headers['Authorization']
    
    # Bearerプレフィックスの対応
    token = if header
              if header.start_with?('Bearer ')
                header.split(' ').last
              else
                header
              end
            end
    
    if token.nil? || token.empty?
      @current_user = nil
      return false
    end
    
    begin
      # トークンをデコードしてユーザーIDを取得
      # JWTConfig モジュールを使用して秘密鍵を取得
      secret_key = JWTConfig.secret_key
      
      decoded = JWT.decode(token, secret_key, true, { algorithm: JWTConfig::ALGORITHM })
      
      user_id = decoded[0]['user_id'].to_s
      
      # ユーザーIDを文字列として扱う
      @current_user = User.find_by(id: user_id)
      
      if @current_user.nil?
        return false
      end
      
      return true
    rescue ActiveRecord::RecordNotFound => e
      @current_user = nil
      return false
    rescue JWT::DecodeError => e
      @current_user = nil
      return false
    rescue JWT::ExpiredSignature => e
      @current_user = nil
      return false
    rescue => e
      @current_user = nil
      return false
    end
  end

  # 必須認証メソッド - コントローラーで認証を必須にする
  def authenticate_user!
    if authenticate_user
      return true
    else
      authentication_error
      return false
    end
  end

  # 認証エラーのレスポンスを返す
  def authentication_error
    render json: { success: false, message: '認証が必要です' }, status: :unauthorized
  end
end
