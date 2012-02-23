# Load the rails application
require File.expand_path('../application', __FILE__)

# Load custom paginate
require File.expand_path('../../lib/paginate', __FILE__)

# Initialize the rails application
Top::Application.initialize!
