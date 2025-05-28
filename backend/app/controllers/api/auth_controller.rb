module Api
  class AuthController < ApplicationController
    # tokenによる認証が必要なアクションを指定
    before_action :authenticate_user, only: [:me, :logout, :change_password]

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
      if current_user
        render json: {
          success: true,
          data: UserSerializer.new(current_user)
        }
      else
        render json: {
          success: false,
          message: 'ユーザー情報が見つかりません'
        }, status: :unauthorized
      end
    end

    # ログアウト
    def logout
      render json: {
        success: true,
        message: 'ログアウトしました'
      }
    end

    # パスワード変更
    def change_password
      # パラメータの検証
      unless params[:current_password].present? && params[:new_password].present? && params[:password_confirmation].present?
        render json: {
          success: false,
          message: '必要なパラメータが不足しています'
        }, status: :bad_request
        return
      end

      # 現在のパスワードの確認
      unless current_user.authenticate(params[:current_password])
        render json: {
          success: false,
          message: '現在のパスワードが正しくありません'
        }, status: :unauthorized
        return
      end

      # 新しいパスワードの確認
      if params[:new_password] != params[:password_confirmation]
        render json: {
          success: false,
          message: '新しいパスワードと確認用パスワードが一致しません'
        }, status: :unprocessable_entity
        return
      end

      # パスワードの長さチェック
      if params[:new_password].length < 6
        render json: {
          success: false,
          message: 'パスワードは6文字以上で入力してください'
        }, status: :unprocessable_entity
        return
      end

      # パスワード更新
      if current_user.update(password: params[:new_password], password_confirmation: params[:password_confirmation])
        render json: {
          success: true,
          message: 'パスワードが正常に変更されました'
        }
      else
        render json: {
          success: false,
          message: 'パスワードの変更に失敗しました',
          errors: current_user.errors.full_messages
        }, status: :unprocessable_entity
      end
    rescue => e
      Rails.logger.error "Password change error: #{e.message}"
      render json: {
        success: false,
        message: 'パスワード変更中にエラーが発生しました'
      }, status: :internal_server_error
    end

    private

    def user_params
      params.permit(:name, :email, :password, :password_confirmation)
    end
  end
end 
