import { LocationFinder } from '../location-finder';
import { LocationResult } from '../models';

describe('LocationFinder', () => {
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
    it('should create an instance with location', () => {
      const finder = new LocationFinder('New York');
      expect(finder).toBeInstanceOf(LocationFinder);
    });

    it('should create an instance with location and currentLocation', () => {
      const finder = new LocationFinder('New York', '40.7128,-74.0060');
      expect(finder).toBeInstanceOf(LocationFinder);
    });
  });

  describe('call instance method', () => {
    it('should fetch locations successfully', async () => {
      const mockResponse: LocationResult[] = [
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'OK',
          results: mockResponse,
        }),
      });

      process.env.GOOGLE_MAPS_KEY = 'test-key';
      process.env.PLACES_API = 'https://maps.googleapis.com/maps/api/place/textsearch/json?';

      const finder = new LocationFinder('New York');
      const result = await finder.call();

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('query=New+York')
      );
    });

    it('should include currentLocation in params when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'OK',
          results: [],
        }),
      });

      process.env.GOOGLE_MAPS_KEY = 'test-key';
      process.env.PLACES_API = 'https://maps.googleapis.com/maps/api/place/textsearch/json?';

      const finder = new LocationFinder('New York', '40.7128,-74.0060');
      await finder.call();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('location=40.7128%2C-74.0060')
      );
    });

    it('should handle ZERO_RESULTS status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ZERO_RESULTS',
          results: [],
        }),
      });

      process.env.GOOGLE_MAPS_KEY = 'test-key';
      process.env.PLACES_API = 'https://maps.googleapis.com/maps/api/place/textsearch/json?';

      const finder = new LocationFinder('InvalidLocation12345');
      const result = await finder.call();

      expect(result).toEqual([]);
    });

    it('should throw error when API returns non-OK status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'REQUEST_DENIED',
          error_message: 'API key invalid',
        }),
      });

      process.env.GOOGLE_MAPS_KEY = 'test-key';
      process.env.PLACES_API = 'https://maps.googleapis.com/maps/api/place/textsearch/json?';

      const finder = new LocationFinder('New York');
      await expect(finder.call()).rejects.toThrow('API key invalid');
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      process.env.GOOGLE_MAPS_KEY = 'test-key';
      process.env.PLACES_API = 'https://maps.googleapis.com/maps/api/place/textsearch/json?';

      const finder = new LocationFinder('New York');
      await expect(finder.call()).rejects.toThrow();
    });

    it('should throw error when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      process.env.GOOGLE_MAPS_KEY = 'test-key';
      process.env.PLACES_API = 'https://maps.googleapis.com/maps/api/place/textsearch/json?';

      const finder = new LocationFinder('New York');
      await expect(finder.call()).rejects.toThrow('Google Places API error: Bad Request');
    });

    it('should use default API URL when PLACES_API is not set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'OK',
          results: [],
        }),
      });

      process.env.GOOGLE_MAPS_KEY = 'test-key';
      delete process.env.PLACES_API;

      const finder = new LocationFinder('New York');
      await finder.call();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://maps.googleapis.com/maps/api/place/textsearch/json?')
      );
    });

    it('should use empty string for API key when GOOGLE_MAPS_KEY is not set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'OK',
          results: [],
        }),
      });

      delete process.env.GOOGLE_MAPS_KEY;
      process.env.PLACES_API = 'https://maps.googleapis.com/maps/api/place/textsearch/json?';

      const finder = new LocationFinder('New York');
      await finder.call();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('key=')
      );
    });
  });

  describe('call static method', () => {
    it('should call instance method correctly', async () => {
      const mockResponse: LocationResult[] = [
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'OK',
          results: mockResponse,
        }),
      });

      process.env.GOOGLE_MAPS_KEY = 'test-key';
      process.env.PLACES_API = 'https://maps.googleapis.com/maps/api/place/textsearch/json?';

      const result = await LocationFinder.call('New York');

      expect(result).toEqual(mockResponse);
    });

    it('should call instance method with currentLocation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'OK',
          results: [],
        }),
      });

      process.env.GOOGLE_MAPS_KEY = 'test-key';
      process.env.PLACES_API = 'https://maps.googleapis.com/maps/api/place/textsearch/json?';

      await LocationFinder.call('New York', '40.7128,-74.0060');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('location=40.7128%2C-74.0060')
      );
    });
  });
});
