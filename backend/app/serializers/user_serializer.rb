class UserSerializer < ActiveModel::Serializer
  attributes :id, :name, :email, :department, :position, :bio, :avatarUrl, :created_at, :updated_at
end 
