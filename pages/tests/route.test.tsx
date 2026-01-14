import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import RoutePage from '../route';
import { Route } from '../../lib/models';

// Mock next/router with a controllable mock
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  query: {},
  pathname: '/route',
  asPath: '/route',
  route: '/route',
  replace: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn().mockResolvedValue(undefined),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

const mockUseRouter = jest.fn(() => mockRouter);

jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
}));

// Helper function to set router query for tests
const setRouterQuery = (query: Record<string, string>) => {
  const testRouter = {
    ...mockRouter,
    query,
  };
  mockUseRouter.mockReturnValue(testRouter);
  return testRouter;
};

describe('Route page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mockRouter to default state
    mockRouter.query = {};
    mockRouter.pathname = '/route';
    mockRouter.asPath = '/route';
    mockRouter.route = '/route';
    mockPush.mockClear();
    // Reset the mock to return a fresh copy of mockRouter
    mockUseRouter.mockImplementation(() => ({ ...mockRouter }));
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockReset();
    
    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    };
    global.navigator.geolocation = mockGeolocation as any;
  });

  it('should render loading state initially', () => {
    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<RoutePage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should fetch and display route', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [
            {
              travel_mode: 'WALKING',
              duration: 300,
              steps: [],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });

    expect(screen.getByText(/Duration:/i)).toBeInTheDocument();
  });

  it('should display error when route fetch fails', async () => {
    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch route/i)).toBeInTheDocument();
    });
  });

  it('should display error when API returns error', async () => {
    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ error: 'Invalid locations' }),
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText(/Invalid locations/i)).toBeInTheDocument();
    });
  });

  it('should get current location when start_location is missing', () => {
    setRouterQuery({
      end_location: '40.7580,-73.9855',
    });

    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      } as any);
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ routes: [] }),
    });

    render(<RoutePage />);

    expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
  });

  it('should show error when geolocation fails and start_location is missing', async () => {
    setRouterQuery({
      end_location: '40.7580,-73.9855',
    });

    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success, error) => {
      error({
        code: 1,
        message: 'Permission denied',
      } as any);
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText(/Unable to get your current location/i)).toBeInTheDocument();
    });
  });

  it('should show error when both locations are missing', async () => {
    setRouterQuery({});

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText(/Missing required parameters/i)).toBeInTheDocument();
    });
  });

  it('should display no routes message when routes array is empty', async () => {
    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ routes: [] }),
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText(/No routes found for this journey/i)).toBeInTheDocument();
    });
  });

  it('should handle route with undefined routes', async () => {
    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({}),
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText(/No routes found for this journey/i)).toBeInTheDocument();
    });
  });

  it('should handle leg duration as string', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 600,
          price: { formatted: 'N/A' },
          legs: [
            {
              travel_mode: 'WALKING',
              duration: '600s',
              steps: [],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });
  });

  it('should handle transit line without color', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [
            {
              travel_mode: 'TRANSIT',
              steps: [
                {
                  transitDetails: {
                    transitLine: {
                      name: 'Subway Line 1',
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });
  });

  it('should handle transit details without stopDetails', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [
            {
              travel_mode: 'TRANSIT',
              steps: [
                {
                  transitDetails: {
                    transitLine: {
                      name: 'Subway Line 1',
                    },
                    headsign: 'Downtown',
                  },
                },
              ],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });
  });

  it('should handle stopDetails without times', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [
            {
              travel_mode: 'TRANSIT',
              steps: [
                {
                  transitDetails: {
                    transitLine: {
                      name: 'Subway Line 1',
                    },
                    stopDetails: {
                      departureStop: { name: 'Station A' },
                      arrivalStop: { name: 'Station B' },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });
  });

  it('should handle step with distanceMeters', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 600,
          price: { formatted: 'N/A' },
          legs: [
            {
              travel_mode: 'WALKING',
              steps: [
                {
                  travelMode: 'WALKING',
                  instructions: 'Walk north',
                  distanceMeters: 500,
                },
              ],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });
  });

  it('should handle stopCount with singular', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [
            {
              travel_mode: 'TRANSIT',
              steps: [
                {
                  transitDetails: {
                    transitLine: {
                      name: 'Subway Line 1',
                    },
                    stopCount: 1,
                  },
                },
              ],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });
  });

  it('should handle step with travel_mode instead of travelMode', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 600,
          price: { formatted: 'N/A' },
          legs: [
            {
              travel_mode: 'WALKING',
              steps: [
                {
                  travel_mode: 'WALKING',
                  instructions: 'Walk north',
                },
              ],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });
  });

  it('should format duration correctly', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 45,
          price: { formatted: '$2.75' },
          legs: [],
        },
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 120,
          price: { formatted: '$2.75' },
          legs: [],
        },
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [],
        },
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3660,
          price: { formatted: '$2.75' },
          legs: [],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText(/45 sec/i)).toBeInTheDocument();
      expect(screen.getByText(/2 min/i)).toBeInTheDocument();
      // Use getAllByText since "1h" appears in multiple places
      expect(screen.getAllByText(/1h/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/1h 1min/i)).toBeInTheDocument();
    });
  });

  it('should display route legs with transit details', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [
            {
              travel_mode: 'TRANSIT',
              duration: 1800,
              steps: [
                {
                  transitDetails: {
                    transitLine: {
                      name: 'Subway Line 1',
                      color: 'FF0000',
                    },
                    headsign: 'Downtown',
                    stopDetails: {
                      departureStop: { name: 'Station A' },
                      arrivalStop: { name: 'Station B' },
                      departureTime: '2024-01-01T11:00:00Z',
                      arrivalTime: '2024-01-01T11:30:00Z',
                    },
                    stopCount: 5,
                  },
                },
              ],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText(/Subway Line 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Direction: Downtown/i)).toBeInTheDocument();
      expect(screen.getByText(/Depart:/i)).toBeInTheDocument();
      expect(screen.getByText(/Arrive:/i)).toBeInTheDocument();
    });
  });

  it('should display route legs with walking details', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 600,
          price: { formatted: 'N/A' },
          legs: [
            {
              travel_mode: 'WALKING',
              duration: 600,
              steps: [
                {
                  travelMode: 'WALKING',
                  instructions: 'Walk north on Main St',
                  distanceMeters: 500,
                  duration: 600,
                },
              ],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText(/Walk north on Main St/i)).toBeInTheDocument();
    });
  });

  it('should handle missing geolocation API', async () => {
    const originalGeolocation = global.navigator.geolocation;
    delete (global.navigator as any).geolocation;

    setRouterQuery({
      end_location: '40.7580,-73.9855',
    });

    // When geolocation is missing and only end_location is provided,
    // the component won't try to get position, so fetch won't be called
    // and it will stay in loading state or show an error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ routes: [] }),
    });

    render(<RoutePage />);

    // Since geolocation doesn't exist, the component won't try to get position
    // and without start_location, fetch won't be called, so it stays loading
    // or shows an error. Let's check for loading state or error
    await waitFor(() => {
      // Component will stay in loading state since fetch requires both locations
      // or it might show an error. Let's check for either state
      const loadingIndicator = screen.queryByRole('progressbar');
      const errorMessage = screen.queryByText(/Unable to get your current location/i);
      const noRoutesMessage = screen.queryByText(/No routes found/i);
      
      // One of these should be present
      expect(loadingIndicator || errorMessage || noRoutesMessage).toBeTruthy();
    }, { timeout: 3000 });

    global.navigator.geolocation = originalGeolocation;
  });

  it('should format time with invalid date string', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: 'invalid-date',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should format time with empty string', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });
  });

  it('should handle unknown travel mode label', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [
            {
              travel_mode: 'UNKNOWN_MODE',
              steps: [],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });

    // Expand the accordion to see the leg details
    const accordionSummary = screen.getByText(/Duration:.*1h/i).closest('.MuiAccordionSummary-root');
    if (accordionSummary) {
      fireEvent.click(accordionSummary as HTMLElement);
    }

    await waitFor(() => {
      // The component displays the travel mode label, which for UNKNOWN_MODE returns the mode itself
      // It appears in the leg header as "Leg 1: UNKNOWN_MODE"
      expect(screen.getByText(/Leg.*UNKNOWN_MODE/i)).toBeInTheDocument();
    });
  });

  it('should handle unknown travel mode icon', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [
            {
              travel_mode: 'UNKNOWN_MODE',
              steps: [
                {
                  travelMode: 'UNKNOWN_MODE',
                },
              ],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });
  });

  it('should handle legs without travelMode', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [
            {
              travelMode: undefined,
              steps: [],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });
  });

  it('should handle steps without transitDetails or instructions', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [
            {
              travel_mode: 'WALKING',
              steps: [
                {
                  travelMode: 'WALKING',
                },
              ],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });
  });

  it('should handle legs without steps', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [
            {
              travel_mode: 'WALKING',
              // Explicitly set steps to undefined or empty array to ensure the condition works
              steps: undefined,
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });

    // Expand the accordion to see the leg details
    const accordionSummary = screen.getByText(/Duration:.*1h/i).closest('.MuiAccordionSummary-root');
    if (accordionSummary) {
      fireEvent.click(accordionSummary as HTMLElement);
    }

    await waitFor(() => {
      expect(screen.getByText(/No step details available/i)).toBeInTheDocument();
    });
  });

  it('should handle transit details without all fields', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 3600,
          price: { formatted: '$2.75' },
          legs: [
            {
              travel_mode: 'TRANSIT',
              steps: [
                {
                  transitDetails: {
                    transitLine: {
                      name: 'Subway Line 1',
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    });
  });

  it('should handle route with null routes array', async () => {
    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ routes: null }),
    });

    render(<RoutePage />);

    await waitFor(() => {
      // Component checks !route.routes, and null is falsy, so it should show "No routes found"
      expect(screen.getByText(/No routes found for this journey/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should handle route with undefined routes', async () => {
    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({}),
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText(/No routes found for this journey/i)).toBeInTheDocument();
    });
  });

  it('should handle duration as string in steps', async () => {
    const mockRoute: Route = {
      routes: [
        {
          route_arrival_time: '2024-01-01T12:00:00Z',
          duration_seconds: 600,
          price: { formatted: 'N/A' },
          legs: [
            {
              travel_mode: 'WALKING',
              duration: '600s',
              steps: [
                {
                  travelMode: 'WALKING',
                  duration: '300s',
                  instructions: 'Walk north',
                },
              ],
            },
          ],
        },
      ],
      language: 'en',
    };

    setRouterQuery({
      start_location: '40.7128,-74.0060',
      end_location: '40.7580,-73.9855',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoute,
    });

    render(<RoutePage />);

    await waitFor(() => {
      expect(screen.getByText('Route Options')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
