class Product
  include MongoMapper::Document

  key :kid, Integer
  key :name, String
  key :img_path, String
  key :path, String
  key :price, String
  key :comment_counter, Integer, :default => 0
  key :user_counter, Integer, :default => 0
  key :category_id, String

  # nodatabase column
  key :uf, Integer # 1,0

  timestamps!

  many :prices

  # belongs_to :category

  searchable do
    text :name
  end


end
