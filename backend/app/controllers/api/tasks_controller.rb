module Api
  class TasksController < ApplicationController
    before_action :authenticate_user!, except: [:index, :show]
    before_action :authenticate_user, only: [:index, :show, :my, :calendar, :dashboard]
    before_action :set_task, only: [:show, :update, :destroy, :update_status, :assign, :toggle_subtask]
    
    # Task コントローラでパラメータを許可する明示的な設定を追加
    wrap_parameters include: [:title, :description, :status, :priority, :due_date, 
                           :assigned_to, :tags, :organization_id, :parent_task_id, 
                           :subtasks, :attachments, :retained_attachment_ids]

    # タスク一覧の取得
    def index
      # フィルタリングと並び替え
      tasks = Task.parent_tasks  # 親タスクのみを取得
      
      # ステータスでフィルタリング
      if params[:status].present?
        tasks = tasks.where(status: params[:status])
      end
      
      # 優先度でフィルタリング
      if params[:priority].present?
        tasks = tasks.where(priority: params[:priority])
      end
      
      # タグでフィルタリング
      if params[:tag].present?
        tasks = tasks.where("tags LIKE ?", "%#{params[:tag]}%")
      end
      
      # 期限でフィルタリング
      if params[:due_date_from].present?
        tasks = tasks.where("due_date >= ?", params[:due_date_from])
      end
      
      if params[:due_date_to].present?
        tasks = tasks.where("due_date <= ?", params[:due_date_to])
      end
      
      # 並び替え
      case params[:sort_by]
      when 'priority'
        tasks = tasks.order(priority: params[:sort_order] || :desc)
      when 'due_date'
        tasks = tasks.order(due_date: params[:sort_order] || :asc)
      else
        tasks = tasks.order(created_at: params[:sort_order] || :desc)
      end
      
      # ページネーション
      tasks = tasks.page(params[:page] || 1).per(params[:per_page] || 10)
      
      # タスクをシリアライズ
      serialized_tasks = tasks.map { |task| TaskSerializer.new(task).as_json }
      
      render json: {
        success: true,
        data: serialized_tasks,  # TaskSerializerを使用して添付ファイルURLを含める
        meta: {
          current_page: tasks.current_page,
          total_pages: tasks.total_pages,
          total_count: tasks.total_count,
          per_page: tasks.limit_value
        }
      }, status: :ok
    rescue => e
      render json: { success: false, message: e.message }, status: :internal_server_error
    end

    # 自分のタスク一覧
    def my
      puts "Getting tasks for user: #{current_user.id} (#{current_user.email})" if Rails.env.development?
      tasks = current_user.tasks.parent_tasks.order(created_at: :desc)  # 親タスクのみ取得
      
      # タスクをシリアライズ
      serialized_tasks = tasks.map { |task| TaskSerializer.new(task).as_json }
      
      render json: { success: true, data: serialized_tasks }  # TaskSerializerを使用
    rescue => e
      puts "Error in my tasks: #{e.message}" if Rails.env.development?
      render json: { success: false, message: e.message }, status: :internal_server_error
    end

    # タスク詳細の取得
    def show
      # タスクをリロードして最新の情報（添付ファイルを含む）を取得
      @task.reload
      
      # TaskSerializerを使用してタスク情報をJSONに変換（添付ファイルURLを含む）
      serialized_task = TaskSerializer.new(@task).as_json
      
      # デバッグログを追加
      puts "[DEBUG] show - Serialized task includes attachment_urls: #{serialized_task.key?('attachment_urls')}"
      if serialized_task['attachment_urls'].present?
        puts "[DEBUG] show - Number of attachment URLs: #{serialized_task['attachment_urls'].size}"
        serialized_task['attachment_urls'].each_with_index do |url_data, index|
          puts "[DEBUG] show - Attachment URL #{index+1}: #{url_data['url']}"
        end
      end
      
      render json: {
        success: true,
        data: serialized_task,
        message: "Task fetched successfully"
      }
    end

    # タスクの作成
    def create
      # --- デバッグコード追加 開始 ---
      puts "[DEBUG] TasksController#create called"
      puts "[DEBUG] params[:task]: #{params[:task].inspect}"
      puts "[DEBUG] params[:task][:attachments]: #{params.dig(:task, :attachments).inspect}" # Use dig for safety
      # --- デバッグコード追加 終了 ---

      # Build task first, then handle attachments separately if needed
      task = current_user.tasks.build(task_params.except(:attachments))

      # --- デバッグコード追加 開始 --- 
      puts "[DEBUG] Task built with params (excluding attachments): #{task.attributes.inspect}"
      # --- デバッグコード追加 終了 --- 

      # トランザクション開始
      ActiveRecord::Base.transaction do
        if task.save
          puts "[DEBUG] Task base saved successfully. ID: #{task.id}" # Log base save

          # Handle attachments after task is saved
          if task_params[:attachments].present?
            puts "[DEBUG] Attaching files: #{task_params[:attachments].map(&:original_filename).join(', ')}" # Log filenames
            begin
              task.attachments.attach(task_params[:attachments])
              puts "[DEBUG] task.attachments.attach called successfully."
            rescue => attach_error
              puts "[DEBUG] Error attaching files: #{attach_error.message}"
              puts attach_error.backtrace.join("\n")
              # Optionally re-raise or add to errors
              task.errors.add(:attachments, "の保存に失敗しました: #{attach_error.message}")
              raise ActiveRecord::Rollback # Rollback transaction
            end
          end

          # --- デバッグコード追加 開始 --- (Re-check attachments)
          task.reload # Reload to get the latest state including attachments
          puts "[DEBUG] task.attachments.attached? after attach: #{task.attachments.attached?}"
          if task.attachments.attached?
            task.attachments.each do |attachment|
              puts "[DEBUG] Attached file confirmed: #{attachment.filename}, size: #{attachment.byte_size}, content_type: #{attachment.content_type}"
            end
          else 
            puts "[DEBUG] No attachments found after attach attempt."
          end
          # --- デバッグコード追加 終了 ---

          # サブタスクの処理 (Attachmentエラーがなければ実行)
          if params[:task][:subtasks].present? && task.errors.empty?
            params[:task][:subtasks].each do |subtask_params|
              subtask = current_user.tasks.build(
                title: subtask_params[:title],
                status: 'pending',
                parent_task_id: task.id,
                organization_id: task.organization_id
              )
              subtask.save!
            end
          end
          
          # Check for errors added during attachment processing before rendering success
          if task.errors.empty?
            # TaskSerializerを使用してタスクデータをシリアライズ
            serialized_task = TaskSerializer.new(task.reload).as_json
            
            render json: { 
              success: true, 
              data: serialized_task, 
              message: 'タスクが作成されました' 
            }, status: :created
          else
            # Render errors if attachment failed
            puts "[DEBUG] Task creation failed due to attachment error."
            render json: { success: false, errors: task.errors.full_messages }, status: :unprocessable_entity
          end

        else
          # --- デバッグコード追加 開始 ---
          puts "[DEBUG] Task initial save failed. Errors: #{task.errors.full_messages.inspect}"
          # --- デバッグコード追加 終了 ---
          render json: { success: false, errors: task.errors.full_messages }, status: :unprocessable_entity
        end
      end
    rescue ActiveRecord::Rollback
        # Transaction was rolled back (likely due to attachment error), errors are already in task.errors
        puts "[DEBUG] Transaction rolled back."
        render json: { success: false, errors: task.errors.full_messages }, status: :unprocessable_entity
    rescue => e
      # --- デバッグコード追加 開始 ---
      puts "[DEBUG] Exception in create: #{e.message}"
      puts e.backtrace.join("\n")
      # --- デバッグコード追加 終了 ---
      render json: { success: false, message: "予期せぬエラーが発生しました: #{e.message}" }, status: :internal_server_error # General error
    end

    # タスクの更新
    def update
      # --- デバッグコード強化 ---
      puts "[DEBUG] TasksController#update called for task ID: #{@task.id}"
      puts "[DEBUG] Content-Type: #{request.content_type}"
      puts "[DEBUG] Request format: #{request.format}"
      puts "[DEBUG] Request method: #{request.method}"
      puts "[DEBUG] Raw params: #{params.inspect}"
      puts "[DEBUG] Files in params: #{params.to_unsafe_h.to_s[0..500]}"
      
      # ファイルアップロードの特別処理
      file_data = []
      if request.content_type =~ /multipart\/form-data/
        puts "[DEBUG] Processing multipart form data"
        params.each do |key, value|
          if value.is_a?(ActionDispatch::Http::UploadedFile) || value.is_a?(Rack::Test::UploadedFile)
            puts "[DEBUG] Found file: #{key} => #{value.original_filename}"
            file_data << value
          end
        end
      end
      
      if file_data.any?
        puts "[DEBUG] Found #{file_data.size} files directly in params"
      end

      current_task_params = task_params # Call task_params once
      # retained_ids の取得は task_params の結果を使用 (クリーニング後の値)
      retained_ids = current_task_params[:retained_attachment_ids] || []
      
      # パラメータから直接添付ファイルを取得
      new_attachments = []
      
      # 1. 標準的なパスでファイルを探す
      if params[:task] && params[:task][:attachments].present?
        puts "[DEBUG] Checking task[attachments] path"
        if params[:task][:attachments].is_a?(Array)
          params[:task][:attachments].each_with_index do |attachment, idx|
            puts "[DEBUG] Examining array attachment #{idx}: #{attachment.class.name}"
            if attachment.respond_to?(:original_filename)
              new_attachments << attachment
              puts "[DEBUG] Found valid file in array: #{attachment.original_filename}"
            end
          end
        elsif params[:task][:attachments].respond_to?(:original_filename)
          new_attachments << params[:task][:attachments]
          puts "[DEBUG] Found single file: #{params[:task][:attachments].original_filename}"
        end
      end
      
      # 2. フォームデータからファイルを直接探す方法
      params.each do |key, value|
        next unless key.to_s.include?('attachment')
        
        puts "[DEBUG] Found potential file param: #{key}"
        if value.is_a?(ActionDispatch::Http::UploadedFile) || value.respond_to?(:original_filename)
          new_attachments << value
          puts "[DEBUG] Found direct file: #{value.original_filename}"
        elsif value.is_a?(Array)
          value.each_with_index do |item, idx|
            if item.is_a?(ActionDispatch::Http::UploadedFile) || item.respond_to?(:original_filename)
              new_attachments << item
              puts "[DEBUG] Found file in array param: #{item.original_filename}"
            end
          end
        end
      end
      
      # 3. ファイルパラメータをさらに探索
      file_params = params.to_unsafe_h.select { |k, v| v.is_a?(ActionDispatch::Http::UploadedFile) }
      file_params.each do |key, value|
        puts "[DEBUG] Found raw file param: #{key} => #{value.original_filename}"
        new_attachments << value
      end
      
      puts "[DEBUG] Filtered attachments: #{new_attachments.inspect}"
      
      # --- 既存のデバッグコード ---
      puts "[DEBUG] Retained Attachment IDs (after permit & clean): #{retained_ids.inspect}"
      puts "[DEBUG] New Attachments received (after permit & clean): #{new_attachments.inspect}"
      # --- 既存のデバッグコード ---

      # トランザクション開始
      ActiveRecord::Base.transaction do
        # --- デバッグコード追加 開始 ---
        existing_attachment_ids = @task.attachments.map { |att| att.id.to_s }
        puts "[DEBUG] Existing Attachment IDs before update: #{existing_attachment_ids.inspect}"
        # --- デバッグコード追加 終了 ---

        # 1. タスクの基本情報を更新 (添付ファイル関連を除く)
        if @task.update(current_task_params.except(:attachments, :retained_attachment_ids, :subtasks))
          puts "[DEBUG] Task base attributes updated successfully."

          # 2. 既存の添付ファイルを整理 (削除)
          begin
            attachments_to_purge = @task.attachments.reject { |att| retained_ids.include?(att.id.to_s) }
            if attachments_to_purge.any?
              puts "[DEBUG] Purging attachments with IDs: #{attachments_to_purge.map(&:id).inspect}"
              attachments_to_purge.each(&:purge) # 個別にpurgeする
              # または attachments_to_purge.purge_later # バックグラウンドで削除する場合
              puts "[DEBUG] Purge process initiated for removed attachments."
              @task.reload # purge後はリロードして状態を反映
            else
              puts "[DEBUG] No attachments need to be purged."
            end
          rescue => purge_error
            puts "[DEBUG] Error purging attachments: #{purge_error.message}"
            puts purge_error.backtrace.join("\n")
            @task.errors.add(:base, "既存の添付ファイルの削除に失敗しました: #{purge_error.message}")
            raise ActiveRecord::Rollback
          end

          # 3. 新しい添付ファイルを追加
          if new_attachments.present? && new_attachments.any?
             puts "[DEBUG] Attempting to attach #{new_attachments.size} files"
             begin
               # ActionDispatch::Http::UploadedFile オブジェクトのみを選択
               valid_attachments = []
               
               # 各添付ファイルの詳細情報をログに出力
               new_attachments.each_with_index do |attachment, idx|
                 puts "[DEBUG] Attachment #{idx} type: #{attachment.class.name}"
                 
                 if attachment.respond_to?(:original_filename)
                   puts "[DEBUG] Filename: #{attachment.original_filename}, Content-Type: #{attachment.content_type}, Size: #{attachment.size rescue 'unknown'}"
                   valid_attachments << attachment
                 end
               end
               
               if valid_attachments.any?
                 puts "[DEBUG] Attaching #{valid_attachments.size} valid files"
                 @task.attachments.attach(valid_attachments)
                 puts "[DEBUG] Attachment complete. Verifying..."
                 
                 # 添付した後の検証
                 @task.reload
                 attached_count = @task.attachments.count
                 puts "[DEBUG] Total attachments after operation: #{attached_count}"
               else
                 puts "[DEBUG] No valid attachments found to attach after strict filtering."
               end
             rescue => attach_error
                puts "[DEBUG] Error attaching new files during update: #{attach_error.message}"
                puts attach_error.backtrace.join("\n")
                @task.errors.add(:attachments, "新しいファイルの追加に失敗しました: #{attach_error.message}")
                raise ActiveRecord::Rollback
             end
          else
             puts "[DEBUG] No new files to attach."
          end

          # --- デバッグコード追加 開始 --- (最終確認)
          @task.reload # Attach後にもリロード
          final_attachment_ids = @task.attachments.map { |att| att.id.to_s }
          puts "[DEBUG] Final Attachment IDs after update: #{final_attachment_ids.inspect}"
          if @task.attachments.attached?
            @task.attachments.each do |attachment|
              puts "[DEBUG] Final attached file: #{attachment.filename}, ID: #{attachment.id}"
            end
          else
            puts "[DEBUG] No attachments found after update process."
          end
          # --- デバッグコード追加 終了 ---

          # サブタスクの更新処理
          if params[:task][:subtasks].present? && @task.errors.empty?
            begin
              # サブタスクのJSONを解析（すでに解析されている場合はそのまま使用）
              subtasks_data = if params[:task][:subtasks].is_a?(String)
                begin
                  JSON.parse(params[:task][:subtasks])
                rescue JSON::ParserError
                  puts "[DEBUG] Failed to parse subtasks JSON, skipping subtask processing"
                  nil
                end
              else
                params[:task][:subtasks]
              end
              
              if subtasks_data.present? && subtasks_data.is_a?(Array)
                puts "[DEBUG] Processing #{subtasks_data.length} subtasks"
                
                # 既存のサブタスクを取得
                existing_subtasks = @task.subtasks.index_by(&:id)
                
                # サブタスクを処理
                subtasks_data.each do |subtask_data|
                  subtask_id = subtask_data['id'].to_s
                  subtask_title = subtask_data['title'].to_s
                  subtask_completed = subtask_data['completed'] == true
                  
                  # 既存のサブタスクの場合は更新
                  if existing_subtasks[subtask_id].present?
                    subtask = existing_subtasks[subtask_id]
                    subtask.update(
                      title: subtask_title,
                      status: subtask_completed ? 'completed' : 'pending'
                    )
                    puts "[DEBUG] Updated existing subtask #{subtask_id}"
                  # 「temp_」で始まるIDは一時的なIDなので新規作成
                  elsif subtask_id.start_with?('temp_') || !subtask_id.present?
                    subtask = Task.create(
                      title: subtask_title,
                      status: subtask_completed ? 'completed' : 'pending',
                      parent_task_id: @task.id,
                      organization_id: @task.organization_id,
                      assigned_to: @task.assigned_to
                    )
                    puts "[DEBUG] Created new subtask with ID #{subtask.id}"
                  end
                end
                
                puts "[DEBUG] Subtasks processing completed"
              end
            rescue => e
              puts "[DEBUG] Error processing subtasks: #{e.message}"
              puts e.backtrace.join("\n")
              # サブタスク処理でエラーが発生してもトランザクション全体をロールバックさせない
            end
          end

          # 4. 最終結果をレンダリング
          if @task.errors.empty?
            # タスクを再読み込みして最新の添付ファイル状態を取得
            @task.reload

            # 添付ファイルIDを確認
            attachment_ids = @task.attachments.map(&:id)
            puts "[DEBUG] Final Attachment IDs after update: #{attachment_ids.inspect}"
            
            # 最終的な添付ファイルの詳細をログに出力
            @task.attachments.each do |att|
              blob = att.blob
              puts "[DEBUG] Final attached file: #{blob.filename}, ID: #{att.id}"
            end

            # TaskSerializerを使用してタスクをシリアライズ
            serialized_task = TaskSerializer.new(@task).as_json
            puts "[DEBUG] Serialized task response: #{serialized_task.inspect}"
           
            render json: {
              success: true,
              data: serialized_task,
              message: 'タスクが更新されました'
            }, status: :ok
          else
             puts "[DEBUG] Task update failed due to errors."
             render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
          end

        else
           # --- デバッグコード追加 開始 ---
          puts "[DEBUG] Task base update failed. Errors: #{@task.errors.full_messages.inspect}"
          # --- デバッグコード追加 終了 ---
          render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
        end
      end
    rescue ActiveRecord::Rollback
        puts "[DEBUG] Transaction rolled back during update."
        # エラーは@task.errorsに含まれているはずなのでそのまま返す
        render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
    rescue => e
      # --- デバッグコード追加 開始 ---
      puts "[DEBUG] Unexpected exception in update: #{e.message}"
      puts e.backtrace.join("\n")
      # --- デバッグコード追加 終了 ---
      render json: { success: false, message: "予期せぬエラーが発生しました: #{e.message}" }, status: :internal_server_error
    end

    # タスクの削除
    def destroy
      @task.destroy
      render json: { success: true, message: 'タスクが削除されました' }
    end

    # タスクのステータス更新
    def update_status
      if @task.update(status: params[:status])
        render json: { success: true, data: @task.reload.as_json(include: :subtasks), message: 'ステータスが更新されました' }
      else
        render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # タスクの担当者を変更
    def assign
      user = User.find_by(id: params[:user_id])
      
      if user.nil?
        return render json: { success: false, message: '指定されたユーザーが見つかりません' }, status: :not_found
      end
      
      @task.assigned_to = user.id
      
      if @task.save
        render json: { success: true, data: @task.reload.as_json(include: :subtasks), message: '担当者が変更されました' }
      else
        render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
      end
    end
    
    # カレンダービュー用のタスクデータ
    def calendar
      start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.current.beginning_of_month
      end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : Date.current.end_of_month
      
      tasks = current_user.tasks.parent_tasks
        .where('due_date BETWEEN ? AND ?', start_date, end_date)
        .order(due_date: :asc)
      
      # カレンダー表示用にデータを整形
      calendar_data = tasks.group_by { |task| task.due_date.to_s }
      
      render json: { success: true, data: calendar_data }
    rescue => e
      render json: { success: false, message: e.message }, status: :internal_server_error
    end
    
    # ダッシュボード用のタスク統計情報
    def dashboard
      # 最近のタスク
      recent_tasks = current_user.tasks.parent_tasks.recent.limit(5)
      
      # 優先度別タスク数
      priority_counts = {
        high: current_user.tasks.parent_tasks.high_priority.count,
        medium: current_user.tasks.parent_tasks.where(priority: 'medium').count,
        low: current_user.tasks.parent_tasks.where(priority: 'low').count
      }
      
      # ステータス別タスク数
      status_counts = {
        pending: current_user.tasks.parent_tasks.pending.count,
        in_progress: current_user.tasks.parent_tasks.in_progress.count,
        completed: current_user.tasks.parent_tasks.completed.count
      }
      
      # 期日間近のタスク
      upcoming_tasks = current_user.tasks.parent_tasks.due_soon.where.not(status: 'completed').limit(5)
      
      # 期限切れタスク
      overdue_tasks = current_user.tasks.parent_tasks.overdue.limit(5)
      
      render json: {
        success: true,
        data: {
          recent_tasks: recent_tasks.as_json(include: :subtasks),
          priority_counts: priority_counts,
          status_counts: status_counts,
          upcoming_tasks: upcoming_tasks.as_json(include: :subtasks),
          overdue_tasks: overdue_tasks.as_json(include: :subtasks)
        }
      }
    rescue => e
      render json: { success: false, message: e.message }, status: :internal_server_error
    end
    
    # 複数タスクの一括更新
    def batch_update
      tasks_params = params[:tasks]
      results = { success: [], failed: [] }
      
      tasks_params.each do |task_param|
        task = Task.find_by(id: task_param[:id])
        
        if task.nil?
          results[:failed] << { id: task_param[:id], error: "タスクが見つかりません" }
          next
        end
        
        # タスクの更新
        if task.update(task_param.permit(:title, :description, :status, :priority, :due_date, :assigned_to, :tags))
          results[:success] << { id: task.id }
        else
          results[:failed] << { id: task.id, errors: task.errors.full_messages }
        end
      end
      
      render json: { success: true, data: results }
    rescue => e
      render json: { success: false, message: e.message }, status: :internal_server_error
    end
    
    # タスクの並び替え（ドラッグ＆ドロップでの順序変更）
    def reorder
      task_ids = params[:task_ids]
      
      if task_ids.blank?
        return render json: { success: false, message: 'タスクIDが指定されていません' }, status: :bad_request
      end
      
      # 並べ替え処理を実装
      # ここでは優先度順で自動的に並べる例を示す
      task_ids.each_with_index do |task_id, index|
        task = Task.find_by(id: task_id)
        if task.present?
          # インデックスに基づいて優先度を設定
          priority = case index
                    when 0..2 then 'high'
                    when 3..7 then 'medium'
                    else 'low'
                    end
          
          task.update(priority: priority)
        end
      end
      
      render json: { success: true, message: 'タスクの順序が更新されました' }
    rescue => e
      render json: { success: false, message: e.message }, status: :internal_server_error
    end

    # サブタスクの完了状態を切り替える
    def toggle_subtask
      subtask = Task.find_by(id: params[:subtask_id], parent_task_id: @task.id)
      
      if subtask.nil?
        return render json: { success: false, message: 'サブタスクが見つかりません' }, status: :not_found
      end
      
      # ステータスの切り替え
      new_status = subtask.status == 'completed' ? 'pending' : 'completed'
      
      if subtask.update(status: new_status)
        render json: { 
          success: true, 
          data: {
            subtask: subtask,
            parent_task: @task.as_json(include: :subtasks)
          }, 
          message: 'サブタスクのステータスが更新されました' 
        }
      else
        render json: { success: false, errors: subtask.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def set_task
      @task = Task.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { success: false, message: 'タスクが見つかりません' }, status: :not_found
    end

    def task_params
      # Permit attachments and retained_attachment_ids
      permitted_params = params.require(:task).permit(
        :title, :description, :status, :priority, :due_date, :assigned_to, :tags, :organization_id, :parent_task_id,
        attachments: [],
        retained_attachment_ids: [], # 残したい既存ファイルのIDリストを許可
        subtasks: [] # サブタスクパラメータを許可
      )

      # --- 添付ファイルの処理 (既存のデバッグコードとロジックは維持) ---
      if permitted_params[:attachments].present? && !permitted_params[:attachments].is_a?(Array)
        puts "[DEBUG] Converting single attachment param to array"
        permitted_params[:attachments] = [permitted_params[:attachments]]
      end
      if permitted_params[:attachments].is_a?(Array)
        permitted_params[:attachments].compact!
        permitted_params[:attachments].reject!(&:blank?)
         puts "[DEBUG] Cleaned attachments array: #{permitted_params[:attachments].inspect}"
      end
      # --- 添付ファイルの処理 終了 ---

      # --- retained_attachment_ids の処理 ---
      # フロントエンドから文字列でIDが送られてくることを想定し、nilを除去
      if permitted_params[:retained_attachment_ids].is_a?(Array)
        permitted_params[:retained_attachment_ids].compact!
        permitted_params[:retained_attachment_ids].reject!(&:blank?)
        puts "[DEBUG] Cleaned retained_attachment_ids array: #{permitted_params[:retained_attachment_ids].inspect}"
      end
      # --- retained_attachment_ids の処理 終了 ---

      # --- サブタスク文字列をJSONとして解析する処理 ---
      if permitted_params[:subtasks].is_a?(String)
        begin
          permitted_params[:subtasks] = JSON.parse(permitted_params[:subtasks])
          puts "[DEBUG] Parsed subtasks JSON: #{permitted_params[:subtasks].inspect}"
        rescue JSON::ParserError => e
          puts "[DEBUG] Failed to parse subtasks JSON: #{e.message}"
          permitted_params.delete(:subtasks)
        end
      end
      # --- サブタスク処理 終了 ---

      puts "[DEBUG] Final permitted task_params: #{permitted_params.inspect}"
      permitted_params
    end
  end
end
