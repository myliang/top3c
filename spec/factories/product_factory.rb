FactoryGirl.define do
  factory :product do
    name '神舟笔记本'
    price '7770.00'
    kid '7899'
    img_path 'http://test.com'
    path 'http://test.com'
    user_counter 111
    comment_counter 111
    category_id 'cpu'
  end
end
