# frozen_string_literal: true
class LocationResult

  attr_accessor :formatted_address, :geometry, :name

  def initialize(formatted_address, geometry, name)
    @formatted_address = formatted_address
    @geometry = geometry
    @name = name
  end
end
