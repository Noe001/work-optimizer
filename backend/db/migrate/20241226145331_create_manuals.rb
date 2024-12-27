class CreateManuals < ActiveRecord::Migration[7.2]
  def change
    create_table :manuals, id: false do |t|
      t.string :id, limit: 36, null: false, primary_key: true
      t.string :title
      t.text :content

      t.timestamps
    end
  end
end
