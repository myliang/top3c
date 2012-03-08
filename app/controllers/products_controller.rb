class ProductsController < ApplicationController

  def search
    puts Product.search { fulltext params[:q] }
  end

  def index
    respond_to do |format|
      format.html # { render "index" }
      format.json { 
        where = {}
        params[:category_id] && where[:category_id] = params[:category_id]
        @products = Product.where(where).
        sort(:comment_counter.desc).paginate(:page => params[:page])
        # puts "::::::::::#{products.length}"
        render :json => to_json
      }
    end
  end

  def follow
    respond_to do |format|
      format.html # { render "follow" }
      format.json { 
        where = {:id => current_user.product_ids}
        params[:category_id] && where[:category_id] = params[:category_id]
        @products = Product.where(where).paginate(:page => params[:page])
        render :json => to_json
      }
    end
  end

  def to_json
    user_products = current_user.hash_products
    @products.each do |product|
      product.uf = user_products[product.id.to_str]
    end
    @products
  end

end
