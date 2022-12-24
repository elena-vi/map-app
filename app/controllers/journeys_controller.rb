class JourneysController < ApplicationController
  def index
  end

  def new
    @current_location = "#{params[:latitude]},#{params[:longitude]}"
    @destination = LocationFinder.call(params[:destination], @current_location)
  end

  def route
    @route = RouteFinder.call(params[:start_location], params[:end_location])
  end
end
