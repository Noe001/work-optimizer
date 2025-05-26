class HealthController < ApplicationController
  # 認証をスキップ（ヘルスチェックは外部からアクセスされる）
  skip_before_action :authenticate_user!, only: [:basic, :detailed, :readiness, liveness]
  skip_before_action :verify_authenticity_token, only: [:basic, :detailed, :readiness, liveness]

  # 基本的なヘルスチェック
  def basic
    result = HealthCheck.basic
    render json: result, status: :ok
  end

  # 詳細なヘルスチェック
  def detailed
    result = HealthCheck.detailed
    status = result[:status] == 'ok' ? :ok : :service_unavailable
    render json: result, status: status
  end

  # 準備状態チェック
  def readiness
    result = HealthCheck.readiness
    status = result[:status] == 'ready' ? :ok : :service_unavailable
    render json: result, status: status
  end

  # 生存状態チェック
  def liveness
    result = HealthCheck.liveness
    render json: result, status: :ok
  end

  # メトリクス情報（Prometheus形式）
  def metrics
    metrics_data = generate_prometheus_metrics
    render plain: metrics_data, content_type: 'text/plain'
  end

  private

  def generate_prometheus_metrics
    metrics = []
    
    # アプリケーション基本メトリクス
    metrics << "# HELP app_info Application information"
    metrics << "# TYPE app_info gauge"
    metrics << "app_info{version=\"#{Rails.application.config.version || '1.0.0'}\"} 1"
    
    # アップタイム
    uptime = (Time.current - Rails.application.config.started_at).to_i rescue 0
    metrics << "# HELP app_uptime_seconds Application uptime in seconds"
    metrics << "# TYPE app_uptime_seconds counter"
    metrics << "app_uptime_seconds #{uptime}"
    
    # データベース接続プール
    begin
      pool = ActiveRecord::Base.connection_pool
      metrics << "# HELP db_connection_pool_size Database connection pool size"
      metrics << "# TYPE db_connection_pool_size gauge"
      metrics << "db_connection_pool_size #{pool.size}"
      
      metrics << "# HELP db_connection_pool_checked_out Database connection pool checked out connections"
      metrics << "# TYPE db_connection_pool_checked_out gauge"
      metrics << "db_connection_pool_checked_out #{pool.checked_out.size}"
      
      metrics << "# HELP db_connection_pool_available Database connection pool available connections"
      metrics << "# TYPE db_connection_pool_available gauge"
      metrics << "db_connection_pool_available #{pool.available.size}"
    rescue => e
      Rails.logger.error "Failed to get database metrics: #{e.message}"
    end
    
    # Action Cable統計
    begin
      stats = ActionCable.server.connections.stats
      metrics << "# HELP action_cable_connections_count Action Cable connections count"
      metrics << "# TYPE action_cable_connections_count gauge"
      metrics << "action_cable_connections_count #{stats[:connections_count] || 0}"
      
      metrics << "# HELP action_cable_channels_count Action Cable channels count"
      metrics << "# TYPE action_cable_channels_count gauge"
      metrics << "action_cable_channels_count #{stats[:channels_count] || 0}"
    rescue => e
      Rails.logger.error "Failed to get Action Cable metrics: #{e.message}"
    end
    
    # チャット関連メトリクス
    begin
      total_messages = Message.count
      total_chat_rooms = ChatRoom.count
      active_users_today = User.where('last_seen_at > ?', 24.hours.ago).count
      
      metrics << "# HELP chat_messages_total Total number of chat messages"
      metrics << "# TYPE chat_messages_total counter"
      metrics << "chat_messages_total #{total_messages}"
      
      metrics << "# HELP chat_rooms_total Total number of chat rooms"
      metrics << "# TYPE chat_rooms_total gauge"
      metrics << "chat_rooms_total #{total_chat_rooms}"
      
      metrics << "# HELP chat_active_users_today Active users in the last 24 hours"
      metrics << "# TYPE chat_active_users_today gauge"
      metrics << "chat_active_users_today #{active_users_today}"
    rescue => e
      Rails.logger.error "Failed to get chat metrics: #{e.message}"
    end
    
    # メモリ使用量
    begin
      memory_usage = `ps -o rss -p #{Process.pid}`.split("\n")[1].to_i * 1024 # bytes
      metrics << "# HELP process_memory_usage_bytes Process memory usage in bytes"
      metrics << "# TYPE process_memory_usage_bytes gauge"
      metrics << "process_memory_usage_bytes #{memory_usage}"
    rescue => e
      Rails.logger.error "Failed to get memory metrics: #{e.message}"
    end
    
    metrics.join("\n")
  end
end 
