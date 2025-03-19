module Api
  class AuthController < ApplicationController
    # tokenによる認証が必要なアクションを指定
    before_action :authenticate_user, only: [:me, :logout]

    # サインアップ
    def signup
      @user = User.new(user_params)
      
      if @user.save
        token = @user.generate_jwt
        puts "Token generated on signup: #{token[0..10]}..." if Rails.env.development?
        
        render json: {
          success: true,
          data: {
            user: UserSerializer.new(@user),
            token: token
          },
          message: 'ユーザー登録が完了しました'
        }, status: :created
      else
        render json: {
          success: false,
          message: 'ユーザー登録に失敗しました',
          errors: @user.errors.messages
        }, status: :unprocessable_entity
      end
    end

    # ログイン
    def login
      @user = User.find_by(email: params[:email].downcase)
      
      if @user && @user.authenticate(params[:password])
        token = @user.generate_jwt
        puts "Token generated on login: #{token[0..10]}..." if Rails.env.development?
        
        render json: {
          success: true,
          data: {
            user: UserSerializer.new(@user),
            token: token
          },
          message: 'ログインしました'
        }
      else
        puts "Login failed: User #{params[:email]} not found or password invalid" if Rails.env.development?
        render json: {
          success: false,
          message: 'メールアドレスまたはパスワードが正しくありません'
        }, status: :unauthorized
      end
    end

    # 現在のユーザー情報取得
    def me
      puts "User info requested for user: #{current_user.email}" if Rails.env.development?
      
      render json: {
        success: true,
        data: UserSerializer.new(current_user),
      }
    rescue => e
      puts "Error in me action: #{e.message}" if Rails.env.development?
      render json: {
        success: false,
        message: 'ユーザー情報の取得に失敗しました',
        error: e.message
      }, status: :internal_server_error
    end

    # ログアウト
    def logout
      # JWTはステートレスなので、フロントエンドでトークンを削除してもらう
      puts "Logout requested for user: #{current_user.email}" if Rails.env.development?
      
      render json: {
        success: true,
        message: 'ログアウトしました'
      }
    end

    private

    def user_params
      params.permit(:name, :email, :password, :password_confirmation)
    end
  end
end 
