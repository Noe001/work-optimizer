class UsersController < ApplicationController
  before_action :authenticate_user! # Ensures user is authenticated for all actions in this controller

  def index
    # This might need to be restricted depending on application requirements
    render json: User.all
  end

  # PUT /api/profile
  def update_profile
    if @current_user.update(profile_params)
      render json: { success: true, user: @current_user.as_json(except: [:password_digest, :activation_digest, :remember_digest, :reset_digest]) }, status: :ok
    else
      render json: { success: false, errors: @current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def profile_params
    # Permit the fields that can be updated through the profile endpoint.
    # avatarUrl is received as a string (URL or base64 data URI based on frontend implementation).
    # For this task, we assume it's a string that gets saved.
    # If actual file upload processing were needed, it would be more complex.
    params.permit(:name, :email, :department, :position, :bio, :avatarUrl)
  end
end
