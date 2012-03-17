class ActionController::Responder
  def to_partial
    puts ":::resources::::::::::::#{resources}"
    puts ":::options::::::::::::#{options}"
    # controller.render :partial => "product", :collection => resource
    # controller.render :text => "test"
  end
end
