module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user
    
    # 接続時の認証
    def connect
      self.current_user = find_verified_user
      log_connection_attempt(true)
      update_user_online_status(true)
    rescue => e
      log_connection_attempt(false, e.message)
      reject_unauthorized_connection
    end
    
    # 切断時の処理
    def disconnect
      log_disconnection
      update_user_online_status(false) if current_user
    end

    private

    # 認証されたユーザーを検索
    def find_verified_user
      # トークンベース認証
      token = request.params[:token] || extract_token_from_headers
      
      unless token
        Rails.logger.warn "WebSocket connection attempt without token from #{request.remote_ip}"
        raise 'No authentication token provided'
      end
      
      # JWTトークンの検証
      begin
        decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base, true, { algorithm: 'HS256' })
        user_id = decoded_token[0]['user_id']
        
        user = User.find_by(id: user_id)
        unless user&.active?
          Rails.logger.warn "WebSocket connection attempt with invalid user: #{user_id}"
          raise 'User not found or inactive'
        end
        
        # レート制限チェック
        check_connection_rate_limit(user)
        
        user
      rescue JWT::DecodeError => e
        Rails.logger.warn "WebSocket connection attempt with invalid JWT: #{e.message}"
        raise 'Invalid authentication token'
      end
    end
    
    # ヘッダーからトークンを抽出
    def extract_token_from_headers
      auth_header = request.headers['Authorization']
      return nil unless auth_header&.start_with?('Bearer ')
      
      auth_header.split(' ').last
    end
    
    # 接続レート制限
    def check_connection_rate_limit(user)
      key = "websocket_connections:#{user.id}"
      current_connections = Rails.cache.read(key) || 0
      
      if current_connections >= 5 # 同時接続数制限
        Rails.logger.warn "WebSocket connection rate limit exceeded for user: #{user.id}"
        raise 'Too many concurrent connections'
      end
      
      Rails.cache.write(key, current_connections + 1, expires_in: 1.hour)
    end
    
    # 接続試行のログ
    def log_connection_attempt(success, error_message = nil)
      if success
        Rails.logger.info "WebSocket connected: user_id=#{current_user&.id}, ip=#{request.remote_ip}, user_agent=#{request.user_agent}"
      else
        Rails.logger.warn "WebSocket connection failed: ip=#{request.remote_ip}, error=#{error_message}, user_agent=#{request.user_agent}"
      end
    end
    
    # 切断のログ
    def log_disconnection
      Rails.logger.info "WebSocket disconnected: user_id=#{current_user&.id}, ip=#{request.remote_ip}"
      
      # 接続数カウンターを減らす
      if current_user
        key = "websocket_connections:#{current_user.id}"
        current_connections = Rails.cache.read(key) || 0
        new_count = [current_connections - 1, 0].max
        
        if new_count > 0
          Rails.cache.write(key, new_count, expires_in: 1.hour)
        else
          Rails.cache.delete(key)
        end
      end
    end
    
    # ユーザーのオンライン状態を更新
    def update_user_online_status(online)
      return unless current_user
      
      if online
        # オンライン状態に設定
        Rails.cache.write("user_online:#{current_user.id}", true, expires_in: 5.minutes)
        current_user.update_column(:last_seen_at, Time.current)
      else
        # オフライン状態に設定（遅延削除）
        Rails.cache.write("user_online:#{current_user.id}", false, expires_in: 30.seconds)
        current_user.update_column(:last_seen_at, Time.current)
      end
    end
  end
end
