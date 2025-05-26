class AddLastSeenAtToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :last_seen_at, :datetime
    add_index :users, :last_seen_at
    
    # 既存ユーザーのlast_seen_atを現在時刻で初期化
    reversible do |dir|
      dir.up do
        User.update_all(last_seen_at: Time.current)
      end
    end
  end
end 
