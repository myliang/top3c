require 'spec_helper'

Rails.env = "development"
puts "evn:::#{Rails.env}"

describe Product do

  let(:product){ FactoryGirl.create(:product) }

  describe "search" do
    it "full index" do
      search = Product.search do 
        fulltext "笔记本" do 
          fields :name
        end
      end
      puts search.results.to_json
      puts "::::::::#{search.total}"
    end
  end
end
