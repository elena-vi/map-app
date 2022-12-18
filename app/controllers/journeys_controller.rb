class JourneysController < ApplicationController
  def index
  end

  def new
    @start = LocationFinder.call(params[:start])
    @destination = LocationFinder.call(params[:destination])
  end
end
