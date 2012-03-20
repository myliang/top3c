class ProductsController < ApplicationController

  def search

    @products = Product.search { 
      fulltext params[:q] 
      order_by :comment_counter
      paginate :page => params[:page]
    }.results

    respond_to_with "search"

  end

  def index
    where_page
    respond_to_with "index"
  end

  def follow
    where_page :id => current_user.product_ids
    respond_to_with "follow"
  end

  private
  def respond_to_with(template)
    respond_to do |format|
      format.html do
        if request.xhr?
          render :partial => "product", :collection => @products
        else 
          flash[:notice] = "没有找到相应的结果" if @products.empty?
          render template
        end
      end
    end

  end
  def where_page(where = {})
    params[:category_id] && where[:category_id] = params[:category_id]
    @products = Product.where(where).sort(:comment_counter.desc).paginate(:page => params[:page])
    user_products = current_user.hash_products
    @products.each { |product| product.uf = user_products[product.id.to_str] }
  end

end
