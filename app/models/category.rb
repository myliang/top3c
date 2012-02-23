class Category
  include MongoMapper::Document
  
  key :kid, String
  key :name, String

  # many :products
end
