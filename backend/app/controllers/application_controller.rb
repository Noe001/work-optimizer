class ApplicationController < ActionController::API
  rescue_from StandardError, with: :handle_error

  private

  def handle_error(e)
    render json: { error: e.message }, status: :internal_server_error
  end
end
