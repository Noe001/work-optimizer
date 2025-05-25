# デフォルトユーザーの作成
User.create!(
  name: 'Admin', 
  email: 'admin@example.com', 
  role: 'admin', 
  password: 'password', 
  password_confirmation: 'password'
)
