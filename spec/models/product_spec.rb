require 'spec_helper'

Rails.env = "development"
puts "evn:::#{Rails.env}"

describe Product do

  let(:product){ FactoryGirl.create(:product) }

  describe "search" do
    it "full index" do
      Product.find_in_batches(:name => "cpu") do |records|
        puts "::::#{records.to_json}"
      end
    end
  end
end
