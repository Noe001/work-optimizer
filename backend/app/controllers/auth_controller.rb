# パスワード変更
def change_password
  current_password = params[:current_password]
  new_password = params[:new_password]
  confirm_password = params[:confirm_password]

  # バリデーション
  if current_password.blank? || new_password.blank? || confirm_password.blank?
    render json: {
      success: false,
      message: '全ての項目を入力してください。'
    }, status: :bad_request
    return
  end

  if new_password != confirm_password
    render json: {
      success: false,
      message: 'パスワードが一致しません。'
    }, status: :bad_request
    return
  end

  if new_password.length < 6
    render json: {
      success: false,
      message: 'パスワードは6文字以上で入力してください。'
    }, status: :bad_request
    return
  end

  # 現在のパスワードを確認
  unless current_user&.authenticate(current_password)
    render json: {
      success: false,
      message: '現在のパスワードが正しくありません。'
    }, status: :unauthorized
    return
  end

  # パスワードを更新
  if current_user.update(password: new_password, password_confirmation: confirm_password)
    render json: {
      success: true,
      message: 'パスワードが正常に変更されました。'
    }
  else
    render json: {
      success: false,
      message: 'パスワードの変更に失敗しました。',
      errors: current_user.errors.full_messages
    }, status: :unprocessable_entity
  end
end 
