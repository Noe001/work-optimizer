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
    return true if current_user_from_session

    header = request.headers['Authorization']
    puts "Authorization header: #{header.inspect}" if Rails.env.development?
    
    # Bearerプレフィックスの対応
    token = if header
              if header.start_with?('Bearer ')
                header.split(' ').last
              else
                header
              end
            end
    
    puts "Extracted token: #{token ? 'present' : 'nil'}" if Rails.env.development?
    
    if token.nil? || token.empty?
      puts "No token provided" if Rails.env.development?
      render json: { success: false, message: 'トークンが提供されていません' }, status: :unauthorized
      return
    end
    
    begin
      # トークンをデコードしてユーザーIDを取得
      decoded = JWT.decode(token, Rails.application.credentials.secret_key_base, true, { algorithm: 'HS256' })
      puts "Decoded token: #{decoded.inspect}" if Rails.env.development?
      
      user_id = decoded[0]['user_id'].to_s
      puts "Looking for user with ID: #{user_id}" if Rails.env.development?
      
      # ユーザーIDを文字列として扱う
      @current_user = User.find_by(id: user_id)
      
      if @current_user.nil?
        puts "User not found with ID: #{user_id}" if Rails.env.development?
        render json: { success: false, message: 'ユーザーが見つかりません' }, status: :unauthorized
        return
      end
      
      puts "User found: #{@current_user.id} (#{@current_user.email})" if Rails.env.development? && @current_user
    rescue ActiveRecord::RecordNotFound => e
      puts "User not found: #{e.message}" if Rails.env.development?
      render json: { success: false, message: 'ユーザーが見つかりません' }, status: :unauthorized
    rescue JWT::DecodeError => e
      puts "Invalid token: #{e.message}" if Rails.env.development?
      render json: { success: false, message: '無効なトークンです' }, status: :unauthorized
    rescue JWT::ExpiredSignature => e
      puts "Expired token: #{e.message}" if Rails.env.development?
      render json: { success: false, message: 'トークンの有効期限が切れています' }, status: :unauthorized
    rescue => e
      puts "Other authentication error: #{e.class} - #{e.message}" if Rails.env.development?
      render json: { success: false, message: '認証エラーが発生しました' }, status: :unauthorized
    end
  end

  # 必須認証メソッド - コントローラーで認証を必須にする
  def authenticate_user!
    authenticate_user || authentication_error
  end

  # 認証エラーのレスポンスを返す
  def authentication_error
    render json: { success: false, message: '認証が必要です' }, status: :unauthorized
  end
end
