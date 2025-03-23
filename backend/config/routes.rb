Rails.application.routes.draw do
  # API routes
  namespace :api do
    get "invitations/create"
    get "invitations/show"
    get "invitations/use"
    get "organizations/create"
    get "organizations/join"
    get "organizations/index"
    get "organizations/show"
    # 認証エンドポイント
    post '/signup', to: 'auth#signup'
    post '/login', to: 'auth#login'
    post 'auth/logout', to: 'auth#logout'
    get 'auth/me', to: 'auth#me'
    
    # セッションベースの認証エンドポイント
    get '/sessions/new', to: 'sessions#new'
    post '/sessions', to: 'sessions#create'
    delete '/sessions', to: 'sessions#destroy'
    
    # マニュアル関連のエンドポイント
    resources :manuals do
      collection do
        get 'search'
        get 'my'  # 自分のマニュアル一覧
      end
    end
    
    # タスク関連のエンドポイント
    resources :tasks do
      collection do
        get 'my'  # 自分のタスク一覧
      end
      
      member do
        put 'status', to: 'tasks#update_status'  # ステータス更新
        put 'assign', to: 'tasks#assign'  # 担当者変更
      end
    end
    
    # ミーティング関連のエンドポイント
    resources :meetings do
      collection do
        get 'my'  # 自分のミーティング一覧
      end
      
      member do
        post 'participants', to: 'meetings#add_participants'
        delete 'participants/:user_id', to: 'meetings#remove_participant'
      end
    end
    
    # 勤怠管理関連のエンドポイント
    get 'attendance', to: 'attendance#index'
    post 'attendance/check-in', to: 'attendance#check_in'
    post 'attendance/check-out', to: 'attendance#check_out'
    post 'attendance/leave', to: 'attendance#request_leave'
    get 'attendance/history', to: 'attendance#get_history'
    get 'attendance/summary', to: 'attendance#get_summary'
    
    # 組織関連
    resources :organizations, only: [:index, :show, :create] do
      # 組織に関連する招待
      resources :invitations, only: [:index, :create]
    end
    post '/organizations/join', to: 'organizations#join'
    
    # 招待関連
    resources :invitations, only: [:show] do
      member do
        delete '/' => 'invitations#delete'
      end
      collection do
        get 'validate/:code', to: 'invitations#validate'
        post 'use/:code', to: 'invitations#use'
      end
    end
  end
end
