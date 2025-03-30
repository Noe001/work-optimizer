class AddActivationDigestToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :activation_digest, :string
  end
end
