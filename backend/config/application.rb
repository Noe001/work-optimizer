require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Backend
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.2

    # UUIDをデフォルトの主キータイプに設定
    config.generators do |g|
      g.orm :active_record, primary_key_type: :uuid
    end

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w(assets tasks))

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")
    config.time_zone = 'Asia/Tokyo'
    config.i18n.default_locale = :ja

    # Disable auto creation of missing keys in translations
    config.i18n.enforce_available_locales = true

    # ActiveStorageのURL生成に必要なホスト設定
    config.active_storage.service = :local
    
    # デフォルトURLオプションを設定（メーラーなどに使用）
    config.action_mailer.default_url_options = { host: 'localhost', port: 3000 }
    
    # ActiveStorageからのURLを生成する際のホスト設定
    config.action_controller.default_url_options = { host: 'localhost', port: 3000 }
    
    config.generators do |g|
      g.test_framework :rspec,
        controller_specs: true,
        request_specs: true,
        routing_specs: true,
        view_specs: false,
        helper_specs: false
    end

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = true
    
    # セッションを使用するためのミドルウェア
    config.session_store :cookie_store, key: '_app_session'
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use config.session_store, config.session_options
  end
end
