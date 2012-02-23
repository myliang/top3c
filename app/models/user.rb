class User
  include MongoMapper::Document
  # plugin MongoMapper::Plugins::IdentityMap

  key :name, String
  key :email, String, :required => true, :unique => true, :length => {:maximum => 30}
  timestamps!

  key :product_ids, Array
  many :products, :in => :product_ids

  validates_format_of :email, :with => /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/ 

  def hash_products
    hash = {}
    self.product_ids.each do |id|
      hash[id] = 1
    end
    hash
  end

  class << self
  end
end
