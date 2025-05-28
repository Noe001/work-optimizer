module Api
  class AuthController < ApplicationController
    # tokenによる認証が必要なアクションを指定
    before_action :authenticate_user!, only: [:me, :logout, :change_password]

    # サインアップ
    def signup
      @user = User.new(user_params)
      
      if @user.save
        token = @user.generate_jwt
        
        render_success(
          {
            user: UserSerializer.new(@user),
            token: token
          },
          'ユーザー登録が完了しました',
          :created
        )
      else
        render_error(
          'ユーザー登録に失敗しました',
          @user.errors.full_messages,
          :unprocessable_entity
        )
      end
    rescue => e
      handle_error(e, 'ユーザー登録中にエラーが発生しました')
    end

    # ログイン
    def login
      @user = User.find_by(email: params[:email]&.downcase)
      
      unless @user
        return render_error(
          'メールアドレスまたはパスワードが正しくありません',
          [],
          :unauthorized
        )
      end
      
      unless @user.authenticate(params[:password])
        return render_error(
          'メールアドレスまたはパスワードが正しくありません',
          [],
          :unauthorized
        )
      end

      # ログイン成功時の処理
      token = @user.generate_jwt
      @user.update(last_login_at: Time.current)
      
      render_success(
        {
          user: UserSerializer.new(@user),
          token: token
        },
        'ログインしました'
      )
    rescue => e
      handle_error(e, 'ログイン処理中にエラーが発生しました')
    end

    # 現在のユーザー情報取得
    def me
      render_success(UserSerializer.new(current_user))
    end

    # ログアウト
    def logout
      # セッションがある場合はクリア
      session[:user_id] = nil if session[:user_id]
      
      render_success(nil, 'ログアウトしました')
    end

    # パスワード変更
    def change_password
      # パラメータの検証
      unless valid_password_change_params?
        return render_error('必要なパラメータが不足しています', [], :bad_request)
      end

      # 現在のパスワードの確認
      unless current_user.authenticate(params[:current_password])
        return render_error('現在のパスワードが正しくありません', [], :unauthorized)
      end

      # 新しいパスワードの確認
      unless passwords_match?
        return render_error('新しいパスワードと確認用パスワードが一致しません', [], :unprocessable_entity)
      end

      # パスワードの長さチェック
      unless valid_password_length?
        return render_error('パスワードは8文字以上で入力してください', [], :unprocessable_entity)
      end

      # パスワード更新
      if current_user.update(password: params[:new_password], password_confirmation: params[:password_confirmation])
        render_success(nil, 'パスワードが正常に変更されました')
      else
        render_error(
          'パスワードの変更に失敗しました',
          current_user.errors.full_messages,
          :unprocessable_entity
        )
      end
    rescue => e
      handle_error(e, 'パスワード変更中にエラーが発生しました')
    end

    private

    def user_params
      permitted_params = [:name, :email, :password, :password_confirmation, :department, :position, :bio]
      
      if params[:auth].present?
        params.require(:auth).permit(permitted_params)
      else
        params.permit(permitted_params)
      end
    end

    # パスワード変更パラメータの検証
    def valid_password_change_params?
      params[:current_password].present? && 
      params[:new_password].present? && 
      params[:password_confirmation].present?
    end

    # パスワードの一致確認
    def passwords_match?
      params[:new_password] == params[:password_confirmation]
    end

    # パスワード長の確認
    def valid_password_length?
      params[:new_password].length >= 8
    end
  end
end 
