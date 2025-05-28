class Api::UsersController < ApplicationController
  before_action :authenticate_user!, except: [:index]
  before_action :set_user, only: [:show, :update, :destroy, :update_profile]
  before_action :verify_profile_ownership, only: [:update, :destroy, :update_profile]

  def index
    render json: User.all
  end

  def show
    render json: @user, serializer: UserSerializer
  end

  # ユーザー情報更新（管理者用）
  def update
    if @user.update(user_params)
      render json: {
        success: true,
        data: UserSerializer.new(@user).as_json,
        message: 'ユーザー情報が正常に更新されました。'
      }
    else
      render json: {
        success: false,
        message: 'ユーザー情報の更新に失敗しました。',
        errors: @user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # ユーザー削除（管理者用）
  def destroy
    if @user.destroy
      render json: {
        success: true,
        message: 'ユーザーが正常に削除されました。'
      }
    else
      render json: {
        success: false,
        message: 'ユーザーの削除に失敗しました。',
        errors: @user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # プロフィール更新
  def update_profile
    # 入力データのサニタイゼーション
    sanitized_params = sanitize_profile_params(profile_params)
    
    if @user.update(sanitized_params)
      render json: {
        success: true,
        data: UserSerializer.new(@user).as_json,
        message: 'プロフィールが正常に更新されました。'
      }
    else
      render json: {
        success: false,
        message: 'プロフィールの更新に失敗しました。',
        errors: @user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  private

  def set_user
    if action_name == 'update_profile'
      @user = current_user
    else
      @user = params[:id] ? User.find(params[:id]) : current_user
    end
  end

  def verify_profile_ownership
    case action_name
    when 'update_profile'
      unless @user == current_user
        render json: {
          success: false,
          message: '権限がありません。'
        }, status: :forbidden
      end
    when 'update', 'destroy'
      # 管理者または本人のみ操作可能
      unless current_user.role == 'admin' || @user == current_user
        render json: {
          success: false,
          message: '権限がありません。'
        }, status: :forbidden
      end
    end
  end

  def user_params
    params.permit(:name, :email, :role, :status, :department, :position, :bio, :avatarUrl)
  end

  def profile_params
    params.permit(:name, :email, :department, :position, :bio, :avatarUrl)
  end

  def sanitize_profile_params(params)
    sanitized = {}
    
    # HTMLタグを除去し、危険な文字をエスケープ
    sanitized[:name] = ActionController::Base.helpers.strip_tags(params[:name])&.strip if params[:name]
    sanitized[:email] = params[:email]&.strip&.downcase if params[:email]
    sanitized[:department] = ActionController::Base.helpers.strip_tags(params[:department])&.strip if params[:department]
    sanitized[:position] = ActionController::Base.helpers.strip_tags(params[:position])&.strip if params[:position]
    sanitized[:bio] = ActionController::Base.helpers.strip_tags(params[:bio])&.strip if params[:bio]
    
    # avatarUrlの処理
    sanitized[:avatarUrl] = params[:avatarUrl] if params[:avatarUrl]
    
    sanitized.compact
  end
end 
