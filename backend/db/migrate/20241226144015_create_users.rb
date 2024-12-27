class CreateUsers < ActiveRecord::Migration[7.2]
  def change
    create_table :users, id: false do |t|
      t.string :id, limit: 36, null: false, primary_key: true
      t.string :name
      t.string :email
      t.string :password_digest
      t.string :role
      t.string :status
      t.timestamp :last_login_at

      t.timestamps
    end
  end
end
