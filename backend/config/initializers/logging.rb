# 構造化ログとパフォーマンス監視の設定

# カスタムログフォーマッター
class StructuredLogger < Logger::Formatter
  def call(severity, timestamp, progname, msg)
    log_entry = {
      timestamp: timestamp.iso8601,
      level: severity,
      message: msg.is_a?(String) ? msg : msg.inspect,
      progname: progname,
      pid: Process.pid,
      thread_id: Thread.current.object_id
    }

    # 追加のコンテキスト情報があれば含める
    if defined?(RequestStore) && RequestStore.store[:log_context]
      log_entry.merge!(RequestStore.store[:log_context])
    end

    "#{log_entry.to_json}\n"
  end
end

# パフォーマンス監視用のミドルウェア
class PerformanceMonitoringMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    start_time = Time.current
    request = ActionDispatch::Request.new(env)
    
    # リクエスト情報をログコンテキストに設定
    log_context = {
      request_id: request.request_id,
      method: request.method,
      path: request.path,
      user_agent: request.user_agent,
      remote_ip: request.remote_ip
    }

    if defined?(RequestStore)
      RequestStore.store[:log_context] = log_context
    end

    status, headers, response = @app.call(env)
    
    # レスポンス時間の計算
    duration = ((Time.current - start_time) * 1000).round(2)
    
    # パフォーマンスログの出力
    Rails.logger.info({
      event: 'request_completed',
      status: status,
      duration_ms: duration,
      **log_context
    }.to_json)

    # 遅いリクエストの警告
    if duration > 1000 # 1秒以上
      Rails.logger.warn({
        event: 'slow_request',
        status: status,
        duration_ms: duration,
        **log_context
      }.to_json)
    end

    [status, headers, response]
  ensure
    # ログコンテキストのクリア
    if defined?(RequestStore)
      RequestStore.store[:log_context] = nil
    end
  end
end

# チャット関連のパフォーマンス監視
module ChatPerformanceMonitoring
  extend ActiveSupport::Concern

  included do
    around_action :monitor_chat_performance, only: [:create, :index, :show]
  end

  private

  def monitor_chat_performance
    start_time = Time.current
    action_name = "#{controller_name}##{action_name}"
    
    begin
      yield
      
      duration = ((Time.current - start_time) * 1000).round(2)
      
      Rails.logger.info({
        event: 'chat_action_completed',
        action: action_name,
        duration_ms: duration,
        user_id: current_user&.id,
        chat_room_id: params[:chat_room_id]
      }.to_json)
      
      # 遅いアクションの警告
      if duration > 500 # 500ms以上
        Rails.logger.warn({
          event: 'slow_chat_action',
          action: action_name,
          duration_ms: duration,
          user_id: current_user&.id,
          chat_room_id: params[:chat_room_id]
        }.to_json)
      end
      
    rescue => e
      duration = ((Time.current - start_time) * 1000).round(2)
      
      Rails.logger.error({
        event: 'chat_action_error',
        action: action_name,
        duration_ms: duration,
        error_class: e.class.name,
        error_message: e.message,
        user_id: current_user&.id,
        chat_room_id: params[:chat_room_id]
      }.to_json)
      
      raise
    end
  end
end

# Action Cable接続の監視
module ActionCableMonitoring
  extend ActiveSupport::Concern

  included do
    before_action :log_connection_start
    after_action :log_connection_end
  end

  private

  def log_connection_start
    Rails.logger.info({
      event: 'action_cable_connection_start',
      connection_id: connection.connection_identifier,
      user_id: current_user&.id,
      timestamp: Time.current.iso8601
    }.to_json)
  end

  def log_connection_end
    Rails.logger.info({
      event: 'action_cable_connection_end',
      connection_id: connection.connection_identifier,
      user_id: current_user&.id,
      timestamp: Time.current.iso8601
    }.to_json)
  end
end

# 設定の適用
Rails.application.configure do
  # 本番環境では構造化ログを使用
  if Rails.env.production?
    config.logger = Logger.new(STDOUT)
    config.logger.formatter = StructuredLogger.new
    config.log_level = :info
  end

  # パフォーマンス監視ミドルウェアの追加
  config.middleware.use PerformanceMonitoringMiddleware

  # ログレベルの設定
  config.log_tags = [:request_id]
  
  # Action Cableのログレベル
  config.action_cable.logger = Rails.logger
end

# ActiveRecordのクエリ監視
if Rails.env.development? || Rails.env.staging?
  ActiveSupport::Notifications.subscribe 'sql.active_record' do |name, start, finish, id, payload|
    duration = ((finish - start) * 1000).round(2)
    
    if duration > 100 # 100ms以上のクエリ
      Rails.logger.warn({
        event: 'slow_query',
        sql: payload[:sql],
        duration_ms: duration,
        name: payload[:name]
      }.to_json)
    end
  end
end

# Action Cableの監視
ActiveSupport::Notifications.subscribe 'perform_action.action_cable' do |name, start, finish, id, payload|
  duration = ((finish - start) * 1000).round(2)
  
  Rails.logger.info({
    event: 'action_cable_perform',
    channel_class: payload[:channel_class],
    action: payload[:action],
    duration_ms: duration,
    data: payload[:data]
  }.to_json)
end

# エラー監視
Rails.application.config.middleware.use ExceptionNotification::Rack,
  ignore_exceptions: ['ActionController::RoutingError'] + ExceptionNotifier.ignored_exceptions,
  email: {
    email_prefix: '[Work Optimizer Error] ',
    sender_address: %{"Work Optimizer" <no-reply@work-optimizer.com>},
    exception_recipients: %w{admin@work-optimizer.com}
  } if Rails.env.production? 
