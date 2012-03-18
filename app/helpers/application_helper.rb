module ApplicationHelper
  def navbar_menus
    controller_name = params[:controller]
    action_name = params[:action]
    [
      [products_path, t("menu.home"), 
        ((controller_name == "welcome" || controller_name == "products") && action_name == "index") ? "active" : ""],
      [follow_products_path, t("menu.follow"),
        (controller_name == "products" && action_name == "follow") ? "active" : ""],
      ["/about", t("menu.about"),
        (controller_name == "welcome" && action_name == "about") ? "active" : ""],
    ]
  end

end
