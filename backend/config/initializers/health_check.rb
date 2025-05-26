# ヘルスチェック機能の設定
Rails.application.configure do
  # ヘルスチェックエンドポイントの設定
  config.health_check = {
    # 基本的なヘルスチェック
    basic: {
      enabled: true,
      path: '/health'
    },
    
    # 詳細なヘルスチェック
    detailed: {
      enabled: true,
      path: '/health/detailed'
    },
    
    # 準備状態チェック
    readiness: {
      enabled: true,
      path: '/health/ready'
    },
    
    # 生存状態チェック
    liveness: {
      enabled: true,
      path: '/health/live'
    }
  }
end

# ヘルスチェッククラス
class HealthCheck
  class << self
    # 基本的なヘルスチェック
    def basic
      {
        status: 'ok',
        timestamp: Time.current.iso8601,
        version: Rails.application.config.version || '1.0.0'
      }
    end

    # 詳細なヘルスチェック
    def detailed
      checks = {
        database: check_database,
        redis: check_redis,
        action_cable: check_action_cable,
        storage: check_storage,
        memory: check_memory
      }

      overall_status = checks.values.all? { |check| check[:status] == 'ok' } ? 'ok' : 'error'

      {
        status: overall_status,
        timestamp: Time.current.iso8601,
        version: Rails.application.config.version || '1.0.0',
        checks: checks
      }
    end

    # 準備状態チェック（アプリケーションがトラフィックを受け入れる準備ができているか）
    def readiness
      checks = {
        database: check_database,
        redis: check_redis
      }

      overall_status = checks.values.all? { |check| check[:status] == 'ok' } ? 'ready' : 'not_ready'

      {
        status: overall_status,
        timestamp: Time.current.iso8601,
        checks: checks
      }
    end

    # 生存状態チェック（アプリケーションが生きているか）
    def liveness
      {
        status: 'alive',
        timestamp: Time.current.iso8601,
        uptime: uptime_seconds
      }
    end

    private

    # データベース接続チェック
    def check_database
      start_time = Time.current
      ActiveRecord::Base.connection.execute('SELECT 1')
      response_time = ((Time.current - start_time) * 1000).round(2)
      
      {
        status: 'ok',
        response_time_ms: response_time,
        connection_pool: {
          size: ActiveRecord::Base.connection_pool.size,
          checked_out: ActiveRecord::Base.connection_pool.checked_out.size,
          available: ActiveRecord::Base.connection_pool.available.size
        }
      }
    rescue => e
      {
        status: 'error',
        error: e.message,
        error_class: e.class.name
      }
    end

    # Redis接続チェック
    def check_redis
      start_time = Time.current
      Redis.current.ping
      response_time = ((Time.current - start_time) * 1000).round(2)
      
      info = Redis.current.info
      
      {
        status: 'ok',
        response_time_ms: response_time,
        memory_usage: info['used_memory_human'],
        connected_clients: info['connected_clients'],
        uptime_seconds: info['uptime_in_seconds']
      }
    rescue => e
      {
        status: 'error',
        error: e.message,
        error_class: e.class.name
      }
    end

    # Action Cable接続チェック
    def check_action_cable
      # Action Cableの統計情報を取得
      stats = ActionCable.server.connections.stats
      
      {
        status: 'ok',
        connections_count: stats[:connections_count] || 0,
        channels_count: stats[:channels_count] || 0
      }
    rescue => e
      {
        status: 'error',
        error: e.message,
        error_class: e.class.name
      }
    end

    # ストレージチェック
    def check_storage
      # 一時ファイルの作成・削除でストレージをテスト
      temp_file = Rails.root.join('tmp', 'health_check_test.txt')
      File.write(temp_file, 'health check test')
      File.delete(temp_file)
      
      # ディスク使用量の取得
      disk_usage = `df -h #{Rails.root}`.split("\n")[1].split
      
      {
        status: 'ok',
        disk_usage: {
          total: disk_usage[1],
          used: disk_usage[2],
          available: disk_usage[3],
          percentage: disk_usage[4]
        }
      }
    rescue => e
      {
        status: 'error',
        error: e.message,
        error_class: e.class.name
      }
    end

    # メモリ使用量チェック
    def check_memory
      # プロセスのメモリ使用量を取得
      memory_usage = `ps -o pid,rss,vsz -p #{Process.pid}`.split("\n")[1].split
      
      {
        status: 'ok',
        process_id: Process.pid,
        rss_kb: memory_usage[1].to_i,
        vsz_kb: memory_usage[2].to_i,
        rss_mb: (memory_usage[1].to_i / 1024.0).round(2),
        vsz_mb: (memory_usage[2].to_i / 1024.0).round(2)
      }
    rescue => e
      {
        status: 'error',
        error: e.message,
        error_class: e.class.name
      }
    end

    # アップタイム（秒）
    def uptime_seconds
      (Time.current - Rails.application.config.started_at).to_i
    rescue
      0
    end
  end
end

# アプリケーション開始時刻を記録
Rails.application.config.started_at = Time.current 
