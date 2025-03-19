module Api
  class SessionsController < ApplicationController
    before_action :set_user, only: [:create]
    before_action :logged_in, only: [:new, :create]
    
    def new
      render json: { message: 'ログインページを表示します' }
    end
    
    def create
      if @user && @user.authenticate(params[:password])
        session[:user_id] = @user.id
        render json: {
          success: true,
          message: 'ログインしました',
          user: {
            id: @user.id,
            name: @user.name,
            email: @user.email
          }
        }
      else
        render json: {
          success: false,
          message: 'メールアドレスまたはパスワードが無効です'
        }, status: :unauthorized
      end
    end
    
    def destroy
      session[:user_id] = nil
      render json: {
        success: true,
        message: 'ログアウトしました'
      }
    end
    
    private
    
    def set_user
      @user = User.find_by(email: params[:email])
    end
    
    def logged_in
      if session[:user_id]
        @user = User.find_by(id: session[:user_id])
        if @user
          render json: {
            success: true,
            message: 'ログインしています',
            user: {
              id: @user.id,
              name: @user.name,
              email: @user.email
            }
          }
        else
          # セッションにユーザーIDがあるがユーザーが見つからない場合はセッションをクリア
          session[:user_id] = nil
        end
      end
    end
  end
end 
