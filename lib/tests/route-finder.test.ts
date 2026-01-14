import { RouteFinder } from '../route-finder';
import { Route, RouteOption } from '../models';

describe('RouteFinder', () => {
  const originalEnv = process.env;
  const mockFetch = global.fetch as jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    mockFetch.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should create an instance with start and end locations', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      expect(finder).toBeInstanceOf(RouteFinder);
    });
  });

  describe('parseLocation', () => {
    it('should parse valid location string', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      // Access private method via any for testing
      const result = (finder as any).parseLocation('40.7128,-74.0060');
      expect(result).toEqual({ latitude: 40.7128, longitude: -74.0060 });
    });

    it('should throw error for invalid location format', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      expect(() => {
        (finder as any).parseLocation('invalid');
      }).toThrow('Invalid location format');
    });

    it('should throw error for NaN values', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      expect(() => {
        (finder as any).parseLocation('abc,def');
      }).toThrow('Invalid location format');
    });
  });

  describe('transformGoogleRouteToRouteOption', () => {
    it('should transform route with string duration', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: '3600s',
        legs: [],
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.duration_seconds).toBe(3600);
    });

    it('should transform route with number duration', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: 3600,
        legs: [],
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.duration_seconds).toBe(3600);
    });

    it('should use arrival time from last leg', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const arrivalTime = '2024-01-01T12:00:00Z';
      const googleRoute = {
        duration: 3600,
        legs: [
          {
            travelMode: 'WALKING',
          },
          {
            travelMode: 'TRANSIT',
            arrivalTime,
          },
        ],
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.route_arrival_time).toBe(arrivalTime);
    });

    it('should calculate arrival time from departure time and duration', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const departureTime = '2024-01-01T11:00:00Z';
      const googleRoute = {
        duration: 3600,
        legs: [
          {
            travelMode: 'TRANSIT',
            departureTime,
            duration: '3600s',
          },
        ],
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      const expectedArrival = new Date(new Date(departureTime).getTime() + 3600 * 1000).toISOString();
      expect(result.route_arrival_time).toBe(expectedArrival);
    });

    it('should transform legs with travel mode', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: 3600,
        legs: [
          {
            travelMode: 'WALKING',
            steps: [],
          },
          {
            travelMode: 'TRANSIT',
            steps: [],
          },
        ],
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.legs).toHaveLength(2);
      expect(result.legs[0].travel_mode).toBe('WALKING');
      expect(result.legs[1].travel_mode).toBe('TRANSIT');
    });

    it('should use travelMode when available (prefer travelMode over travel_mode)', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: 3600,
        legs: [
          {
            travelMode: 'DRIVE',
            travel_mode: 'WALKING', // This should be ignored
            steps: [],
          },
        ],
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.legs[0].travel_mode).toBe('DRIVE');
    });

    it('should use travel_mode when travelMode is falsy', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: 3600,
        legs: [
          {
            travelMode: null, // falsy
            travel_mode: 'WALKING',
            steps: [],
          },
        ],
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.legs[0].travel_mode).toBe('WALKING');
    });

    it('should default to TRANSIT when both travelMode and travel_mode are falsy', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: 3600,
        legs: [
          {
            travelMode: undefined,
            travel_mode: undefined,
            steps: [],
          },
        ],
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.legs[0].travel_mode).toBe('TRANSIT');
    });

    it('should extract price from travelAdvisory', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: 3600,
        legs: [],
        travelAdvisory: {
          transitFare: {
            text: '$2.75',
            value: 275,
            currencyCode: 'USD',
          },
        },
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.price.formatted).toBe('$2.75');
    });

    it('should extract price from localizedValues', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: 3600,
        legs: [],
        localizedValues: {
          transitFare: {
            text: '$2.75',
          },
        },
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.price.formatted).toBe('$2.75');
    });

    it('should default price to N/A when not available', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: 3600,
        legs: [],
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.price.formatted).toBe('N/A');
    });

    it('should handle price with value but no text', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: 3600,
        legs: [],
        travelAdvisory: {
          transitFare: {
            value: 275,
            currencyCode: 'USD',
          },
        },
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.price.formatted).toBe('USD 275');
    });

    it('should handle price with value but no currencyCode', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: 3600,
        legs: [],
        travelAdvisory: {
          transitFare: {
            value: 275,
          },
        },
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      // .trim() removes leading space, so expect "275" instead of " 275"
      expect(result.price.formatted).toBe('275');
    });

    it('should handle price with value 0', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: 3600,
        legs: [],
        travelAdvisory: {
          transitFare: {
            value: 0,
            currencyCode: 'USD',
          },
        },
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.price.formatted).toBe('USD 0');
    });

    it('should handle price with null value', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: 3600,
        legs: [],
        travelAdvisory: {
          transitFare: {
            value: null,
            currencyCode: 'USD',
          },
        },
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.price.formatted).toBe('N/A');
    });

    it('should handle leg duration as number', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const departureTime = '2024-01-01T11:00:00Z';
      const googleRoute = {
        duration: 3600,
        legs: [
          {
            travelMode: 'TRANSIT',
            departureTime,
            duration: 3600,
          },
        ],
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      const expectedArrival = new Date(new Date(departureTime).getTime() + 3600 * 1000).toISOString();
      expect(result.route_arrival_time).toBe(expectedArrival);
    });

    it('should handle leg without duration', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const departureTime = '2024-01-01T11:00:00Z';
      const googleRoute = {
        duration: 3600,
        legs: [
          {
            travelMode: 'TRANSIT',
            departureTime,
          },
        ],
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.route_arrival_time).toBeDefined();
    });

    it('should handle route without legs', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: 3600,
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.legs).toEqual([]);
      expect(result.duration_seconds).toBe(3600);
    });

    it('should handle route without duration', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        legs: [],
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.duration_seconds).toBe(0);
    });

    it('should handle duration string without s suffix', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: '3600',
        legs: [],
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      expect(result.duration_seconds).toBe(3600);
    });

    it('should handle duration string that cannot be parsed', () => {
      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const googleRoute = {
        duration: 'invalid',
        legs: [],
      };
      const result = (finder as any).transformGoogleRouteToRouteOption(googleRoute);
      // parseInt('invalid'.replace('s', '')) returns NaN, so || 0 should make it 0
      expect(result.duration_seconds).toBe(0);
    });
  });

  describe('call instance method', () => {
    it('should fetch route successfully', async () => {
      const mockRoute: Route = {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          routes: [
            {
              duration: 3600,
              legs: [],
            },
          ],
        }),
      });

      process.env.GOOGLE_ROUTES_API_KEY = 'test-key';
      process.env.GOOGLE_ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const result = await finder.call();

      expect(result.routes).toHaveLength(1);
      expect(result.language).toBe('en');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://routes.googleapis.com/directions/v2:computeRoutes'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Goog-Api-Key': 'test-key',
          }),
        })
      );
    });

    it('should use GOOGLE_MAPS_KEY as fallback', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          routes: [
            {
              duration: 3600,
              legs: [],
            },
          ],
        }),
      });

      process.env.GOOGLE_MAPS_KEY = 'fallback-key';
      delete process.env.GOOGLE_ROUTES_API_KEY;
      process.env.GOOGLE_ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const result = await finder.call();

      expect(result.routes).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Goog-Api-Key': 'fallback-key',
          }),
        })
      );
    });

    it('should use default API URL when not set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          routes: [
            {
              duration: 3600,
              legs: [],
            },
          ],
        }),
      });

      process.env.GOOGLE_ROUTES_API_KEY = 'test-key';
      delete process.env.GOOGLE_ROUTES_API_URL;

      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const result = await finder.call();

      expect(result.routes).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        expect.any(Object)
      );
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.GOOGLE_ROUTES_API_KEY;
      delete process.env.GOOGLE_MAPS_KEY;

      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      await expect(finder.call()).rejects.toThrow('Google Routes API key is required');
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      process.env.GOOGLE_ROUTES_API_KEY = 'test-key';
      process.env.GOOGLE_ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      await expect(finder.call()).rejects.toThrow();
    });

    it('should throw error when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid request',
      });

      process.env.GOOGLE_ROUTES_API_KEY = 'test-key';
      process.env.GOOGLE_ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      await expect(finder.call()).rejects.toThrow('Google Routes API error');
    });

    it('should parse location correctly in request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          routes: [
            {
              duration: 3600,
              legs: [],
            },
          ],
        }),
      });

      process.env.GOOGLE_ROUTES_API_KEY = 'test-key';
      process.env.GOOGLE_ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const result = await finder.call();

      expect(result.routes).toHaveLength(1);
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.origin.location.latLng.latitude).toBe(40.7128);
      expect(requestBody.origin.location.latLng.longitude).toBe(-74.0060);
      expect(requestBody.destination.location.latLng.latitude).toBe(40.7580);
      expect(requestBody.destination.location.latLng.longitude).toBe(-73.9855);
    });
  });

  describe('call static method', () => {
    it('should call instance method correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          routes: [
            {
              duration: 3600,
              legs: [],
            },
          ],
        }),
      });

      process.env.GOOGLE_ROUTES_API_KEY = 'test-key';
      process.env.GOOGLE_ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

      const result = await RouteFinder.call('40.7128,-74.0060', '40.7580,-73.9855');

      expect(result).toBeDefined();
      expect(result.routes).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle response with undefined routes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      process.env.GOOGLE_ROUTES_API_KEY = 'test-key';
      process.env.GOOGLE_ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const result = await finder.call();

      expect(result.routes).toEqual([]);
    });

    it('should handle response with null routes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ routes: null }),
      });

      process.env.GOOGLE_ROUTES_API_KEY = 'test-key';
      process.env.GOOGLE_ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

      const finder = new RouteFinder('40.7128,-74.0060', '40.7580,-73.9855');
      const result = await finder.call();

      expect(result.routes).toEqual([]);
    });
  });
});
