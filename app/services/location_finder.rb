require "uri"
require "net/http"

class LocationFinder < ApplicationService
  attr_reader :location
  PLACES_API = "https://maps.googleapis.com/maps/api/place/textsearch/json?"

  def initialize(location, current_location)
    @location = location
    @current_location = current_location
  end

  def call
    params = {
      query: @location,
      fields: "formatted_address,name,geometry",
      location: @current_location,
      key: ENV["GOOGLE_MAPS_KEY"]
    }
    url = URI(PLACES_API+params.to_param)

    https = Net::HTTP.new(url.host, url.port)
    https.use_ssl = true

    request = Net::HTTP::Get.new(url)

    response = https.request(request)
    location = Locations.new
    location.from_json(response.read_body)
    list = location.results.map do |result|
      LocationResult.new(result["formatted_address"], result["geometry"], result["name"])
    end
    return list
  end
end