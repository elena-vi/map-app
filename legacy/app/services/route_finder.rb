require "uri"
require "net/http"

class RouteFinder < ApplicationService
  attr_reader :end_location
  API_URL = "https://api.external.citymapper.com/api/1/directions/transit?"

  def initialize(start_location, end_location)
    @end_location = end_location
    @start_location = start_location
  end

  def call
    params = {
      start: @start_location,
      end: @end_location,
      time: Time.now.iso8601,
      time_type: 'depart',
      language: 'en'
    }
    url = URI(API_URL+params.to_param)

    https = Net::HTTP.new(url.host, url.port)
    https.use_ssl = true

    request = Net::HTTP::Get.new(url, {'Citymapper-Partner-Key' => ENV["CITY_MAPPER_KEY"]})


    response = https.request(request)
    route = Route.new
    route.from_json(response.read_body)

    return route
  end
end