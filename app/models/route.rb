# frozen_string_literal: true
class Route
  include ActiveModel::Serializers::JSON

  attr_accessor :routes, :language, :error_code, :message

  def attributes=(hash)
    hash.each do |key, value|
      send("#{key}=", value)
    end
  end

  def attributes
    instance_values
  end

end
