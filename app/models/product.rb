class Product
  include MongoMapper::Document

  key :kid, String
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

  SHANGCHENG = {"360buy" => "京东商城", "newegg" => "新蛋商城", "tao3c" => "高鸿商城", "coo8" => "库巴购物", "suning" => "苏宁易购"}

  # belongs_to :category

  searchable do
    text :name
    integer :comment_counter
  end


  def created_at_js
    self.prices.map { |price| price.created_at.strftime("%m-%d") }.to_json
  end
  def price_series
    [{:name => SHANGCHENG[self.kid.split("_")[1]], 
     :data => self.prices.map { |price| price.price.to_i }}].to_json
  end

end
