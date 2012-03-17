class ProductsController < ApplicationController

  def search
    respond_to do |format|
      format.html
      format.json {

        @products = Product.search { 
          fulltext params[:q] 
          order_by :comment_counter
          paginate :page => params[:page]
        }.results

        render :json => to_json

      }
    end
  end

  def index
    where_page
    respond_with @products# , :partial => "product"
  end

  def follow
    where_page :id => current_user.product_ids
    respond_to do |format|
      format.html # { render "follow" }
      format.json { 
        render @products
      }
    end
  end

  private
  def where_page(where = {})
    params[:category_id] && where[:category_id] = params[:category_id]
    @products = Product.where(where).sort(:comment_counter.desc).paginate(:page => params[:page])
  end

  def to_json
    user_products = current_user.hash_products
    @products.each do |product|
      product.uf = user_products[product.id.to_str]
    end
    @products
  end

end
