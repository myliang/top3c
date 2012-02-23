class Price
  include MongoMapper::EmbeddedDocument

  key :price, String

  timestamps!
end
