class CreateManuals < ActiveRecord::Migration[7.2]
  def change
    create_table :manuals, id: :string do |t|
      t.string :title
      t.text :content

      t.timestamps
    end
  end
end
