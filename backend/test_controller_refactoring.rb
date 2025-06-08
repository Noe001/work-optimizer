#!/usr/bin/env ruby

require 'net/http'
require 'json'
require 'uri'

# テスト用の設定
BASE_URL = 'http://localhost:3000'
API_BASE = "#{BASE_URL}/api"

# ログイン情報（実際の認証トークンに置き換える必要があります）
def get_auth_headers
  # 実際のプロジェクトではログイン処理を行ってトークンを取得
  {
    'Content-Type' => 'application/json',
    'Authorization' => 'Bearer YOUR_TOKEN_HERE'
  }
end

def test_api_endpoint(endpoint, params = {})
  uri = URI("#{API_BASE}#{endpoint}")
  uri.query = URI.encode_www_form(params) unless params.empty?
  
  puts "\n=== Testing: #{endpoint} ==="
  puts "URL: #{uri}"
  puts "Params: #{params}"
  
  begin
    http = Net::HTTP.new(uri.host, uri.port)
    request = Net::HTTP::Get.new(uri, get_auth_headers)
    
    response = http.request(request)
    puts "Status: #{response.code}"
    
    if response.code == '200'
      data = JSON.parse(response.body)
      puts "Success: #{data['success']}"
      if data['data'] && data['data']['data']
        puts "Results count: #{data['data']['data'].length}"
        puts "Total count: #{data['data']['meta']['total_count']}" if data['data']['meta']
      end
    else
      puts "Error: #{response.body}"
    end
  rescue => e
    puts "Request failed: #{e.message}"
  end
end

# テストケース実行
puts "=== ManualsController リファクタリング動作確認 ==="

# 1. 基本的なマニュアル一覧取得
test_api_endpoint('/manuals')

# 2. ステータスフィルター付きマニュアル一覧
test_api_endpoint('/manuals', { status: 'published' })
test_api_endpoint('/manuals', { status: 'all' })
test_api_endpoint('/manuals', { status: 'draft' })

# 3. 部門とカテゴリフィルター
test_api_endpoint('/manuals', { department: 'dev', category: 'system' })

# 4. 検索クエリ付きマニュアル一覧
test_api_endpoint('/manuals', { query: 'テスト' })

# 5. ソート設定
test_api_endpoint('/manuals', { order_by: 'title', order: 'asc' })

# 6. 複合フィルター
test_api_endpoint('/manuals', { 
  department: 'sales', 
  status: 'published', 
  query: 'マニュアル',
  order_by: 'created_at',
  order: 'desc'
})

# 7. 検索API
test_api_endpoint('/manuals/search', { query: 'プロセス' })

# 8. 詳細検索
test_api_endpoint('/manuals/search', {
  title: 'ガイド',
  department: 'hr',
  status: 'published'
})

# 9. 統計情報
test_api_endpoint('/manuals/stats')

# 10. 自分のマニュアル（ソート機能とステータスフィルター追加）
test_api_endpoint('/manuals/my')
test_api_endpoint('/manuals/my', { status: 'draft' })
test_api_endpoint('/manuals/my', { status: 'published' })
test_api_endpoint('/manuals/my', { status: 'all', order_by: 'title', order: 'asc' })

# 11. 不正なソートパラメータのテスト
test_api_endpoint('/manuals', { order_by: 'invalid_column', order: 'invalid_direction' })

# 12. 不正なステータスパラメータのテスト
test_api_endpoint('/manuals/my', { status: 'invalid_status' })

puts "\n=== テスト完了 ==="
puts "注意: 実際のテストを行うには、適切な認証トークンを設定してください" 
