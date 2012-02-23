class ApplicationController < ActionController::Base
  protect_from_forgery

  rescue_from ActionController::RoutingError, :with => :url_not_found #:route_not_found
  rescue_from ActionController::MethodNotAllowed, :with => :url_not_found #:invalid_method
  rescue_from AbstractController::ActionNotFound, :with => :url_not_found # :action_not_found
  rescue_from ActionView::MissingTemplate, :with => :url_not_found #:missing_template
  rescue_from ActiveRecord::RecordNotFound, :with => :url_not_found

  before_filter :category_filter
  helper_method :user_signed_in?, :current_user

  def category_filter
    @categories = Category.all
  end

  def authorize
    user_id = cookies[:user_id]
    unless user_id
      redirect_to :controller => "products", :action => "index"
      return 
    end
    #
  end

  def current_user
    user_id = cookies[:user_id]
    user_id && User.find(user_id) || User.new
  end

  def user_signed_in?
    cookies[:user_id]
  end

  def url_not_found
    respond_to do |format|
      format.html { redirect_to "/404" }
      format.json { render :text => "404" }
    end
  end
end
