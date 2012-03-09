class UsersController < ApplicationController

  def follow
    if params[:type] == 'add'
      current_user.add_to_set(:product_ids => params[:product_id])
      Product.increment({:id => params[:product_id]}, :user_counter => 1)
    elsif params[:type] == 'remove'
      current_user.pull(:product_ids => params[:product_id])
      Product.decrement({:id => params[:product_id]}, :user_counter => 1)
    end
    render :json => []
  end

  def create
    user = User.find_by_email(params[:user][:email])
    if user
      cookies.permanent.signed[:user_id] = user._id
      redirect_to :controller => "products", :action => "follow"
    else
      user = User.new(params[:user])
      if user.save
        cookies.permanent.signed[:user_id] = user._id
        redirect_to :controller => "products", :action => "follow"
      else
        flash[:notice] = user.errors.full_messages
        redirect_to :controller => "products", :action => "index"
      end
    end
  end

  def logout
    cookies.delete :user_id
    redirect_to :controller => "products", :action => "index"
  end

end
