require 'active_record'
require 'action_controller'

module Paginate
  module InstanceMethods
  end

  module ClassMethods
    def page(opts = {})
      opts[:page_index] ||= 0
      opts[:page_rows] ||= 10
      offset(opts[:page_index].to_i * opts[:page_rows].to_i).limit(opts[:page_rows])
      # if opts[:page_index] !~ /\d/ && opts[:page_rows] !~ /\d/
      #   raise ActionController::RoutingError 
      # end

      # 快速查询，但是不通用，所以暂时不使用(如果要使用需要修改页面)
      # if opts[:page_index].to_i > 0 
      #   where("#{self.table_name}.id < ?", opts[:page_index].to_i).limit(opts[:page_rows])
      # else
      #   limit(opts[:page_rows])
      # end
    end
  end
end

# extend ActiveRecord
class ActiveRecord::Base
  include ::Paginate::InstanceMethods
  extend ::Paginate::ClassMethods
end
# module MongoMapper::Document
#   include ::Paginate::InstanceMethods
#   extend ::Paginate::ClassMethods
# end

