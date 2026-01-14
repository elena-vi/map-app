import { createMocks } from 'node-mocks-http';
import handler from '../locations';
import { LocationFinder } from '../../../lib/location-finder';

jest.mock('../../../lib/location-finder');

describe('/api/locations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return locations on successful request', async () => {
    const mockLocations = [
      {
        name: 'New York, NY, USA',
        formatted_address: 'New York, NY, USA',
        geometry: {
          location: {
            lat: 40.7128,
            lng: -74.0060,
          },
        },
      },
    ];

    (LocationFinder.call as jest.Mock).mockResolvedValueOnce(mockLocations);

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        destination: 'New York',
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockLocations);
    expect(LocationFinder.call).toHaveBeenCalledWith('New York', undefined);
  });

  it('should include currentLocation when provided', async () => {
    const mockLocations: any[] = [];

    (LocationFinder.call as jest.Mock).mockResolvedValueOnce(mockLocations);

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        destination: 'New York',
        currentLocation: '40.7128,-74.0060',
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(LocationFinder.call).toHaveBeenCalledWith('New York', '40.7128,-74.0060');
  });

  it('should return 400 when destination is missing', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {},
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toContain('Missing required parameter: destination');
  });

  it('should return 405 when method is not GET', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: {
        destination: 'New York',
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Method not allowed');
  });

  it('should return 500 when LocationFinder throws error', async () => {
    const errorMessage = 'API error';
    (LocationFinder.call as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        destination: 'New York',
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe(errorMessage);
  });

  it('should handle errors without message', async () => {
    (LocationFinder.call as jest.Mock).mockRejectedValueOnce({});

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        destination: 'New York',
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Failed to fetch locations');
  });
});
