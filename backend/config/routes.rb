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
    
    # ユーザー管理
    resources :users, only: [:index, :show, :update, :destroy]
    
    # 組織関連
    resources :organizations do
      member do
        post :add_member
        delete :remove_member
      end
      
      # 組織に関連する招待
      resources :invitations, only: [:index, :create]
    end
    post '/organizations/join', to: 'organizations#join'
    
    # 招待関連
    resources :invitations, only: [:index, :create, :show, :destroy] do
      member do
        post :accept
        post :reject
      end
      collection do
        get 'validate/:code', to: 'invitations#validate'
        post 'use/:code', to: 'invitations#use'
      end
    end

    # タスク管理
    resources :tasks do
      collection do
        get :calendar
        get :dashboard
        get :my  # 自分のタスク一覧
      end
      
      member do
        put 'status', to: 'tasks#update_status'  # ステータス更新
        put 'assign', to: 'tasks#assign'  # 担当者変更
      end
    end
    
    # マニュアル管理
    resources :manuals do
      collection do
        get :search
        get :categories
        get :my  # 自分のマニュアル一覧
      end
    end
    
    # ミーティング管理
    resources :meetings do
      resources :meeting_participants, only: [:index, :create, :destroy]
      collection do
        get :my  # 自分のミーティング一覧
      end
      
      member do
        post 'participants', to: 'meetings#add_participants'
        delete 'participants/:user_id', to: 'meetings#remove_participant'
      end
    end
    
    # 勤怠管理
    scope :attendance do
      get '/', to: 'attendance#index'
      post '/check-in', to: 'attendance#check_in'
      post '/check-out', to: 'attendance#check_out'
      put '/', to: 'attendance#update'
      post '/leave', to: 'attendance#request_leave'
      get '/history', to: 'attendance#history'
      get '/leave-history', to: 'attendance#leave_history'
      get '/summary', to: 'attendance#summary'
    end
  end
end
