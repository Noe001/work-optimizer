class ChangeRecordIdToStringInActiveStorageAttachments < ActiveRecord::Migration[7.2]
  INDEX_NAME = 'index_active_storage_attachments_uniqueness'

  def up
    # Remove the old uniqueness index if it exists
    if index_exists?(:active_storage_attachments, [:record_type, :record_id, :name, :blob_id], name: INDEX_NAME)
      remove_index :active_storage_attachments, name: INDEX_NAME
    end

    # Change the column type
    change_column :active_storage_attachments, :record_id, :string, limit: 36 # UUIDs are 36 chars

    # Re-add the uniqueness index with the string record_id
    add_index :active_storage_attachments, [:record_type, :record_id, :name, :blob_id], name: INDEX_NAME, unique: true
  end

  def down
    # Remove the new uniqueness index
    if index_exists?(:active_storage_attachments, [:record_type, :record_id, :name, :blob_id], name: INDEX_NAME)
       remove_index :active_storage_attachments, name: INDEX_NAME
    end

    # Change the column type back to bigint
    change_column :active_storage_attachments, :record_id, :bigint

    # Re-add the old uniqueness index
    add_index :active_storage_attachments, [:record_type, :record_id, :name, :blob_id], name: INDEX_NAME, unique: true
  end
end
