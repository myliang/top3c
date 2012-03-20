module ApplicationHelper
  def navbar_menus
    controller_name = params[:controller]
    action_name = params[:action]
    ret = [[products_path, t("menu.home"), 
            ((controller_name == "welcome" || controller_name == "products") && action_name == "index") ? "active" : ""]]
    if user_signed_in?
      ret << [follow_products_path, t("menu.follow"),
              (controller_name == "products" && action_name == "follow") ? "active" : ""]
    end
    ret << ["/about", t("menu.about"),
            (controller_name == "welcome" && action_name == "about") ? "active" : ""]
    ret
  end

end
