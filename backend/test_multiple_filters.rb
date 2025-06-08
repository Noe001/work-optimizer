#!/usr/bin/env ruby

# 複数フィルターテストスクリプト
puts "=== Multiple Filters Test ==="

# パラメーターをシミュレート
test_params = {
  department: 'dev',
  category: 'system', 
  status: 'published',
  query: 'manual'
}

puts "Test parameters: #{test_params.inspect}"

# 手動でフィルター処理をシミュレート
puts "\n--- Manual Filter Simulation ---"

begin
  # ベースクエリ
  manuals = Manual.includes(:user)
  puts "Base query count: #{manuals.count}"

  # 部門フィルター
  if test_params[:department].present?
    manuals = manuals.where(department: test_params[:department])
    puts "After department filter (#{test_params[:department]}): #{manuals.count}"
  end

  # カテゴリフィルター  
  if test_params[:category].present?
    manuals = manuals.where(category: test_params[:category])
    puts "After category filter (#{test_params[:category]}): #{manuals.count}"
  end

  # ステータスフィルター
  if test_params[:status].present?
    manuals = manuals.where(status: test_params[:status])
    puts "After status filter (#{test_params[:status]}): #{manuals.count}"
  end

  # 検索クエリフィルター
  if test_params[:query].present?
    sanitized_query = ActiveRecord::Base.sanitize_sql_like(test_params[:query])
    manuals = manuals.where(
      'LOWER(title) LIKE LOWER(?) OR LOWER(content) LIKE LOWER(?)', 
      "%#{sanitized_query}%", "%#{sanitized_query}%"
    )
    puts "After query filter (#{test_params[:query]}): #{manuals.count}"
  end

  puts "\nFinal SQL query:"
  puts manuals.to_sql

  puts "\n--- Database Content Analysis ---"
  puts "Total manuals in DB: #{Manual.count}"
  puts "Departments: #{Manual.distinct.pluck(:department).compact.inspect}"
  puts "Categories: #{Manual.distinct.pluck(:category).compact.inspect}"
  puts "Statuses: #{Manual.distinct.pluck(:status).compact.inspect}"
  
  # 各部門・カテゴリー・ステータスの組み合わせ数を表示
  Manual.distinct.pluck(:department).compact.each do |dept|
    Manual.distinct.pluck(:category).compact.each do |cat|
      Manual.distinct.pluck(:status).compact.each do |stat|
        count = Manual.where(department: dept, category: cat, status: stat).count
        puts "#{dept} x #{cat} x #{stat}: #{count} records" if count > 0
      end
    end
  end

rescue => e
  puts "Error occurred: #{e.message}"
  puts e.backtrace
end

puts "\n=== Test Completed ===" 
