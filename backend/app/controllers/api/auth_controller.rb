module Api
  class AuthController < ApplicationController
    # tokenによる認証が必要なアクションを指定
    before_action :authenticate_user, only: [:me, :logout]

    # サインアップ
    def signup
      @user = User.new(user_params)
      
      if @user.save
        token = @user.generate_jwt
        
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
      
      if @user.nil?
        render json: {
          success: false,
          message: 'メールアドレスまたはパスワードが正しくありません'
        }, status: :unauthorized
        return
      end
      
      if @user.authenticate(params[:password])
        token = @user.generate_jwt
        
        render json: {
          success: true,
          data: {
            user: UserSerializer.new(@user),
            token: token
          },
          message: 'ログインしました'
        }
      else
        render json: {
          success: false,
          message: 'メールアドレスまたはパスワードが正しくありません'
        }, status: :unauthorized
      end
    rescue => e
      render json: {
        success: false,
        message: 'ログイン処理中にエラーが発生しました'
      }, status: :internal_server_error
    end

    # 現在のユーザー情報取得
    def me
      render json: {
        success: true,
        data: UserSerializer.new(current_user),
      }
    end

    # ログアウト
    def logout
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
