require "test_helper"

class Api::InvitationsControllerTest < ActionDispatch::IntegrationTest
  test "should get create" do
    get api_invitations_create_url
    assert_response :success
  end

  test "should get show" do
    get api_invitations_show_url
    assert_response :success
  end

  test "should get use" do
    get api_invitations_use_url
    assert_response :success
  end
end
