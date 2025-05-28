class ApplicationController < ActionController::API
  include ActionController::Cookies
  
  attr_reader :current_user

  # 共通エラーハンドリング
  rescue_from StandardError, with: :handle_internal_error
  rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :handle_validation_error

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

    token = extract_token_from_header
    return false if token.blank?
    
    @current_user = authenticate_with_jwt(token)
    @current_user.present?
  end

  # 必須認証メソッド - コントローラーで認証を必須にする
  def authenticate_user!
    authenticate_user || authentication_error
  end

  # 認証エラーのレスポンスを返す
  def authentication_error
    render json: { 
      success: false, 
      message: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    }, status: :unauthorized
  end

  # 統一されたエラーハンドリング
  def handle_error(error, message = 'エラーが発生しました', status = :internal_server_error)
    log_error(error)
    
    render json: {
      success: false,
      message: message,
      code: error.class.name,
      errors: extract_error_details(error)
    }, status: status
  end

  # 内部サーバーエラー
  def handle_internal_error(error)
    handle_error(error, 'サーバー内部エラーが発生しました', :internal_server_error)
  end

  # レコードが見つからない
  def handle_not_found(error)
    handle_error(error, 'リソースが見つかりません', :not_found)
  end

  # バリデーションエラー
  def handle_validation_error(error)
    handle_error(error, 'データの形式が正しくありません', :unprocessable_entity)
  end

  # 成功レスポンスの統一
  def render_success(data = nil, message = '成功しました', status = :ok)
    response = {
      success: true,
      message: message
    }
    response[:data] = data if data.present?
    
    render json: response, status: status
  end

  # 失敗レスポンスの統一
  def render_error(message = 'エラーが発生しました', errors = [], status = :bad_request)
    render json: {
      success: false,
      message: message,
      errors: errors
    }, status: status
  end

  private

  # ヘッダーからトークンを抽出
  def extract_token_from_header
    header = request.headers['Authorization']
    return nil unless header
    
    if header.start_with?('Bearer ')
      header.split(' ').last
    else
      header
    end
  end

  # JWTトークンでユーザーを認証
  def authenticate_with_jwt(token)
    decoded = JWTConfig.decode(token)
    return nil unless decoded
    
    payload = decoded.first
    user_id = payload['user_id'].to_s
    
    User.find_by(id: user_id)
  rescue => e
    Rails.logger.error "JWT authentication failed: #{e.message}"
    nil
  end

  # エラーログの出力
  def log_error(error)
    Rails.logger.error "#{self.class.name}##{action_name}: #{error.message}"
    Rails.logger.error error.backtrace.join("\n") if error.backtrace
  end

  # エラー詳細の抽出
  def extract_error_details(error)
    case error
    when ActiveRecord::RecordInvalid
      error.record.errors.full_messages
    when ActiveModel::ValidationError
      error.model.errors.full_messages
    else
      []
    end
  end
end
