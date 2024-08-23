# frozen_string_literal: true
class Locations
  include ActiveModel::Serializers::JSON

  attr_accessor :html_attributions, :results, :status, :error_message, :info_messages, :next_page_token

  def attributes=(hash)
    hash.each do |key, value|
      send("#{key}=", value)
    end
  end

  def attributes
    instance_values
  end
end
