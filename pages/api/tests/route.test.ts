import { createMocks } from 'node-mocks-http';
import handler from '../route';
import { RouteFinder } from '../../../lib/route-finder';

jest.mock('../../../lib/route-finder');

describe('/api/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return route on successful request', async () => {
    const mockRoute = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [],
        },
      ],
      language: 'en',
    };

    (RouteFinder.call as jest.Mock).mockResolvedValueOnce(mockRoute);

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        start_location: '40.7128,-74.0060',
        end_location: '40.7580,-73.9855',
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockRoute);
    expect(RouteFinder.call).toHaveBeenCalledWith('40.7128,-74.0060', '40.7580,-73.9855');
  });

  it('should return 400 when end_location is missing', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        start_location: '40.7128,-74.0060',
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toContain('Missing required parameter: end_location');
  });

  it('should return 400 when start_location is missing', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        end_location: '40.7580,-73.9855',
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toContain('Start location is required');
  });

  it('should return 405 when method is not GET', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: {
        start_location: '40.7128,-74.0060',
        end_location: '40.7580,-73.9855',
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Method not allowed');
  });

  it('should return 500 when RouteFinder throws error', async () => {
    const errorMessage = 'API error';
    (RouteFinder.call as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        start_location: '40.7128,-74.0060',
        end_location: '40.7580,-73.9855',
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe(errorMessage);
  });

  it('should handle errors without message', async () => {
    (RouteFinder.call as jest.Mock).mockRejectedValueOnce({});

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        start_location: '40.7128,-74.0060',
        end_location: '40.7580,-73.9855',
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Failed to fetch route');
  });
});
