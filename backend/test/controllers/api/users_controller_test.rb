require "test_helper"

class Api::UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @activated_user = users(:activated_user) # From fixtures
    # For simplicity, directly use the user's generate_jwt method.
    # In a real app, you might have a helper or directly mock authentication.
    @auth_token = @activated_user.generate_jwt
    @auth_headers = { 'Authorization' => "Bearer #{@auth_token}" }
  end

  # Helper to parse JSON response body
  def json_response
    JSON.parse(response.body)
  end

  test "should get 401 for update_profile without authentication" do
    put api_profile_url, params: { user: { name: "New Name" } }
    assert_response :unauthorized
    assert_equal "認証が必要です", json_response['message']
  end

  test "should update profile with valid data" do
    new_name = "Updated Name"
    new_bio = "This is an updated bio."
    new_department = "Research & Development"
    new_position = "Lead Engineer"
    new_email = "updated_activated@example.com" # Ensure this email is unique if tested against DB
    new_avatar_url = "/new/avatar.png"

    profile_params = {
      name: new_name,
      bio: new_bio,
      department: new_department,
      position: new_position,
      email: new_email,
      avatarUrl: new_avatar_url # Note: frontend sends avatarUrl, backend permits :avatarUrl
    }

    put api_profile_url, params: profile_params, headers: @auth_headers
    assert_response :ok
    assert json_response['success']

    @activated_user.reload
    assert_equal new_name, @activated_user.name
    assert_equal new_bio, @activated_user.bio
    assert_equal new_department, @activated_user.department
    assert_equal new_position, @activated_user.position
    assert_equal new_email, @activated_user.email
    # The model User.rb does not have avatarUrl column added in the migration for this task,
    # but the controller permits it. If it were a real column that was added, we'd test it:
    # assert_equal new_avatar_url, @activated_user.avatarUrl

    # Check response data
    assert_equal new_name, json_response['user']['name']
    assert_equal new_email, json_response['user']['email']
    assert_equal new_department, json_response['user']['department']
    # avatarUrl is not part of the User model directly, so it won't be in the response's 'user' object
    # unless explicitly handled. The current controller includes all permitted params if they are columns.
  end

  test "should not update profile with invalid email" do
    original_email = @activated_user.email
    profile_params = { email: "invalid-email" }

    put api_profile_url, params: profile_params, headers: @auth_headers
    assert_response :unprocessable_entity
    assert_not json_response['success']
    assert json_response['errors'].any? { |e| e.include?("メールアドレスは不正な値です") } # Check for email format error message

    @activated_user.reload
    assert_equal original_email, @activated_user.email # Email should not have changed
  end
  
  test "should partially update profile (e.g., only bio and department)" do
    original_name = @activated_user.name
    original_email = @activated_user.email
    new_bio = "A very new bio for partial update."
    new_department = "Special Ops"

    profile_params = {
      bio: new_bio,
      department: new_department
    }

    put api_profile_url, params: profile_params, headers: @auth_headers
    assert_response :ok
    assert json_response['success']

    @activated_user.reload
    assert_equal new_bio, @activated_user.bio
    assert_equal new_department, @activated_user.department
    assert_equal original_name, @activated_user.name # Name should be unchanged
    assert_equal original_email, @activated_user.email # Email should be unchanged
    
    assert_equal new_bio, json_response['user']['bio']
    assert_equal new_department, json_response['user']['department']
    assert_equal original_name, json_response['user']['name']
  end

  test "should not update profile with overly long name" do
    original_name = @activated_user.name
    long_name = "a" * 51 # User model has validates :name, length: { maximum: 50 }
    profile_params = { name: long_name }

    put api_profile_url, params: profile_params, headers: @auth_headers
    assert_response :unprocessable_entity
    assert_not json_response['success']
    assert json_response['errors'].any? { |e| e.include?("名前は50文字以内で入力してください") }


    @activated_user.reload
    assert_equal original_name, @activated_user.name # Name should not have changed
  end
end
