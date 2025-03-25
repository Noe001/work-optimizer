class CreateUsers < ActiveRecord::Migration[7.2]
  def change
    create_table :users, id: :string do |t|
      t.string :name
      t.string :email
      t.string :password_digest
      t.string :role
      t.string :status
      t.timestamp :last_login_at

      t.timestamps
    end
    
    add_index :users, :email, unique: true
  end
end
