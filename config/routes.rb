Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  root "journeys#index"

  get '/new', to: 'journeys#new', as: 'new'

  get '/route', to: 'journeys#route', as: 'route'

end
