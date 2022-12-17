require "test_helper"

class JourneysControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get journeys_index_url
    assert_response :success
  end
end
