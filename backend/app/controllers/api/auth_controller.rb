module Api
  class AuthController < ApplicationController
    # tokenによる認証が必要なアクションを指定
    # change_passwordは認証されたユーザーのみが実行できるべきなので、認証必須とする
    before_action :authenticate_user!, only: [:me, :logout, :change_password]

    # 認証関連のエラーコード定数
    module LoginErrorCodes
      INVALID_CREDENTIALS = 'INVALID_CREDENTIALS'           # 認証情報が無効
      USER_NOT_FOUND = 'USER_NOT_FOUND'                    # ユーザーが見つからない
      INVALID_PASSWORD = 'INVALID_PASSWORD'                # パスワードが無効
      MISSING_PARAMETERS = 'MISSING_PARAMETERS'            # 必要なパラメータが不足
    end

    module PasswordChangeErrorCodes
      MISSING_PARAMETERS = 'MISSING_PARAMETERS'            # 必要なパラメータが不足
      CURRENT_PASSWORD_INVALID = 'CURRENT_PASSWORD_INVALID' # 現在のパスワードが無効
      PASSWORD_MISMATCH = 'PASSWORD_MISMATCH'              # パスワードが一致しない
      PASSWORD_TOO_SHORT = 'PASSWORD_TOO_SHORT'            # パスワードが短すぎる
      UPDATE_FAILED = 'UPDATE_FAILED'                      # 更新に失敗
    end

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
        # バリデーションエラーの詳細な日本語メッセージを返す
        detailed_errors = @user.errors.full_messages
        
        render_error(
          'ユーザー登録に失敗しました',
          detailed_errors,
          :unprocessable_entity
        )
      end
    rescue => e
      handle_error(e, 'ユーザー登録中にエラーが発生しました')
    end

    # ログイン
    def login
      # authパラメータが存在する場合とない場合の両方に対応
      if params[:auth].present?
        auth_params = params.require(:auth).permit(:email, :password)
        email = auth_params[:email]
        password = auth_params[:password]
      else
        email = params[:email]
        password = params[:password]
      end

      # パラメータの検証
      if email.blank? || password.blank?
        return render_auth_error(
          LoginErrorCodes::MISSING_PARAMETERS,
          'メールアドレスとパスワードを入力してください',
          :bad_request
        )
      end
      
      @user = User.find_by(email: email&.downcase)
      
      unless @user
        return render_auth_error(
          LoginErrorCodes::USER_NOT_FOUND,
          'メールアドレスまたはパスワードが正しくありません',
          :unauthorized
        )
      end
      
      auth_result = @user.authenticate(password)
      
      unless auth_result
        return render_auth_error(
          LoginErrorCodes::INVALID_PASSWORD,
          'メールアドレスまたはパスワードが正しくありません',
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
      # N+1問題を防ぐためにeager loadingを実行
      user_with_organizations = current_user_with_organizations
      render_success(UserSerializer.new(user_with_organizations))
    end

    # ログアウト
    def logout
      # セッションがある場合はクリア
      session[:user_id] = nil if session[:user_id]
      
      render_success(nil, 'ログアウトしました')
    end

    # パスワード変更（認証必須）
    # セキュリティ上、認証されたユーザーのみがパスワード変更を実行できる
    def change_password
      # パラメータの検証
      unless valid_password_change_params?
        return render_auth_error(
          PasswordChangeErrorCodes::MISSING_PARAMETERS,
          '必要なパラメータが不足しています',
          :bad_request
        )
      end

      # 現在のパスワードの確認
      unless current_user.authenticate(params[:current_password])
        return render_auth_error(
          PasswordChangeErrorCodes::CURRENT_PASSWORD_INVALID,
          '現在のパスワードが正しくありません',
          :unauthorized
        )
      end

      # 新しいパスワードの確認
      unless passwords_match?
        return render_auth_error(
          PasswordChangeErrorCodes::PASSWORD_MISMATCH,
          '新しいパスワードと確認用パスワードが一致しません',
          :unprocessable_entity
        )
      end

      # パスワードの長さチェック
      unless valid_password_length?
        return render_auth_error(
          PasswordChangeErrorCodes::PASSWORD_TOO_SHORT,
          'パスワードは8文字以上で入力してください',
          :unprocessable_entity
        )
      end

      # パスワード更新
      if current_user.update(password: params[:new_password], password_confirmation: params[:password_confirmation])
        render_success(nil, 'パスワードが正常に変更されました')
      else
        render_auth_error(
          PasswordChangeErrorCodes::UPDATE_FAILED,
          'パスワードの変更に失敗しました',
          :unprocessable_entity,
          current_user.errors.full_messages
        )
      end
    rescue => e
      handle_error(e, 'パスワード変更中にエラーが発生しました')
    end

    private

    # 認証関連のエラーレスポンス（詳細なエラーコード付き）
    def render_auth_error(code, message, status, errors = [])
      render json: {
        success: false,
        message: message,
        code: code,
        errors: errors,
        timestamp: Time.current.iso8601
      }, status: status
    end

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
