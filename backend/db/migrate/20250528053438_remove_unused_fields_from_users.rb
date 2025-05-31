class RemoveUnusedFieldsFromUsers < ActiveRecord::Migration[7.2]
  def change
    remove_column :users, :activation_digest, :string, if_exists: true
  end
end
