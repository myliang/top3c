require 'spec_helper'

describe User do
  let(:user) { FactoryGirl.create(:user) }
  let(:origin_user) { FactoryGirl.build(:user) }

  after do
    # mongodb 需要手动清空数据
    user.destroy
  end

  describe "instance methods" do
    it "follow should be user's product_ids +1" do
      user.follow(1)
      user.product_ids.should have(1).items
      user.product_ids.last.should == 1
    end
  end

  describe "validate" do
    describe "email" do

      it "should be not empty" do
        origin_user.email = nil
        origin_user.save.should be_false
        origin_user.should have(2).error_on(:email)
      end

      it "should be normal format" do
        origin_user.email = "liang"
        origin_user.save.should be_false
        origin_user.should have(1).error_on(:email)
      end

      it "length should be lt 30" do
        origin_user.email = "liangyuliangyyyyyyyyyyyyyyyyyyyyyyyy@163.com"
        origin_user.save.should be_false
        origin_user.should have(1).error_on(:email)
      end

      it "should be unique" do
        origin_user.email = user.email
        origin_user.save.should be_false
        origin_user.should have(1).error_on(:email)
      end
      
    end
  end
end
