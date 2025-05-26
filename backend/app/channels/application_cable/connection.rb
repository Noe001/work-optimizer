module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user
    
    def connect
      self.current_user = find_verified_user
    end
    
    private
    
    def find_verified_user
      # セッションからの認証を試みる
      if session_user = find_user_from_session
        return session_user
      end
      
      # JWTトークンからの認証を試みる
      if token_user = find_user_from_token
        return token_user
      end
      
      # 認証失敗
      reject_unauthorized_connection
    end
    
    def find_user_from_session
      if session[:user_id]
        User.find_by(id: session[:user_id])
      end
    end
    
    def find_user_from_token
      # Try to get token from headers first
      header = request.headers['Authorization']
      
      # Bearerプレフィックスの対応
      token = if header
                if header.start_with?('Bearer ')
                  header.split(' ').last
                else
                  header
                end
              end
      
      # If no token in headers, try to get from URL params
      if token.nil? || token.empty?
        token = request.params['token']
      end
      
      return nil if token.nil? || token.empty?
      
      begin
        # トークンをデコードしてユーザーIDを取得
        secret_key = JWTConfig.secret_key
        decoded = JWT.decode(token, secret_key, true, { algorithm: JWTConfig::ALGORITHM })
        user_id = decoded[0]['user_id'].to_s
        
        # ユーザーIDを文字列として扱う
        User.find_by(id: user_id)
      rescue => e
        nil
      end
    end
  end
end
