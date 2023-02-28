class JourneysController < ApplicationController
  def index
  end

  def new
    @current_location = "#{params[:latitude]},#{params[:longitude]}"
    @destination = LocationFinder.call(params[:destination], @current_location)
    # http://localhost:3000/new?latitude=51.87031943030411&longitude=-0.6070437476562257&destination=Euston+&commit=Find+your+way
  end

  def route
    @route = RouteFinder.call(params[:start_location], params[:end_location])
    pp @route
  end
end
