require 'bundler/capistrano' #添加之后部署时会调用bundle install， 如果不需要就可以注释掉
require "whenever/capistrano"

# 设置whenever
set :whenever_environment, defer { :production }
set :whenever_command, "bundle exec whenever"


# 设置path
set :default_environment, {
  'PATH' => "/opt/ruby1.8.7/bin:$PATH"
}

set :application, "top3c"
set :repository,  "git@github.com:myliang/top3c.git"
set :keep_releases, 5 #只保留5个备份

set :scm, :git
set :scm_username, "liangyuliang0335@gmail.com" # 资源库的用户名
set :scm_verbose, true
# set :scm_password, Proc.new { Capistrano::CLI.password_prompt('git Password: ') }
set :branch, "master"
set :deploy_via, :remote_cache

# 服务器
set :user, "myliang"   # 服务器 SSH 用户名
set :deploy_to, "/var/www/#{application}"
set :use_sudo, false
# permission
ssh_options[:forward_agent] = true

role :web, "115.100.249.73" # 前端 Web 服务器
role :app, "115.100.249.73" # Rails 应用服务器
role :db,  "115.100.249.73" , :primary => true 

# if you're still using the script/reaper helper you will need
# these http://github.com/rails/irs_process_scripts

# If you are using Passenger mod_rails uncomment this:
namespace :deploy do
  task :start do ; end
  task :stop do ; end
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "touch #{File.join(current_path,'tmp','restart.txt')}"
  end
end
#
desc "Copy shared config files to current application."
task :after_update_code, :roles => :app do
  # mongodb
  run "cp -f #{shared_path}/config/mongo.rb #{release_path}/config/initializers/mongo.rb"
  # run "cp -f #{shared_path}/config/database.yml #{release_path}/config/"
end
