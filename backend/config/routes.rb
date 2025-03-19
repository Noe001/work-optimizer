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
    
    # ワークライフバランス関連のエンドポイント
    get 'work-life-balance', to: 'work_life_balance#index'
    put 'work-life-balance/wellness/:id', to: 'work_life_balance#update_wellness'
    post 'work-life-balance/goals', to: 'work_life_balance#set_goal'
    get 'work-life-balance/history', to: 'work_life_balance#get_history'
    
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
