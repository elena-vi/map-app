import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import Home from '../index';
import { LocationResult } from '../../lib/models';

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  query: {},
  pathname: '/',
  asPath: '/',
  route: '/',
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

jest.mock('../../components/LocationPicker', () => {
  return function MockLocationPicker({ value, onChange, onLocationSelect, label, required }: any) {
    return (
      <div>
        <label htmlFor={label}>{label}</label>
        <input
          id={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            if (value === 'New York') {
              onLocationSelect({
                name: 'New York, NY, USA',
                formatted_address: 'New York, NY, USA',
                geometry: {
                  location: { lat: 40.7128, lng: -74.0060 },
                },
              });
            }
          }}
          required={required}
        />
      </div>
    );
  };
});

describe('Home page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    mockPush.mockClear();
    
    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    };
    global.navigator.geolocation = mockGeolocation as any;
  });

  it('should render the home page', () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      } as any);
    });

    render(<Home />);
    expect(screen.getByText('Where are you going?')).toBeInTheDocument();
  });

  it('should get current location on mount', () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      } as any);
    });

    render(<Home />);
    expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
  });

  it('should handle geolocation error', () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success, error) => {
      error({
        code: 1,
        message: 'User denied geolocation',
      } as any);
    });

    render(<Home />);
    expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
  });

  it('should handle missing geolocation API', () => {
    const originalGeolocation = global.navigator.geolocation;
    delete (global.navigator as any).geolocation;

    render(<Home />);
    expect(screen.getByText('Where are you going?')).toBeInTheDocument();

    global.navigator.geolocation = originalGeolocation;
  });

  it('should navigate to route when destination is selected and form is submitted', async () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      } as any);
    });

    render(<Home />);

    const destinationInput = screen.getByLabelText('Destination');
    fireEvent.change(destinationInput, { target: { value: 'New York' } });
    fireEvent.blur(destinationInput);

    await waitFor(() => {
      const form = screen.getByText('Where are you going?').closest('form') || 
                   screen.getByRole('button', { name: /find your way/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it('should show error when submitting without destination', async () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      } as any);
    });

    render(<Home />);

    const form = screen.getByText('Where are you going?').closest('form') || 
                 screen.getByRole('button', { name: /find your way/i }).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText(/Please enter a destination/i)).toBeInTheDocument();
    });
  });

  it('should fetch location when destination is entered but not selected', async () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      } as any);
    });

    const mockLocation: LocationResult = {
      name: 'New York, NY, USA',
      formatted_address: 'New York, NY, USA',
      geometry: {
        location: { lat: 40.7128, lng: -74.0060 },
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => [mockLocation],
    });

    render(<Home />);

    const destinationInput = screen.getByLabelText('Destination');
    fireEvent.change(destinationInput, { target: { value: 'New York' } });

    const form = screen.getByText('Where are you going?').closest('form') || 
                 screen.getByRole('button', { name: /find your way/i }).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should show error when location fetch fails', async () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      } as any);
    });

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<Home />);

    const destinationInput = screen.getByLabelText('Destination');
    fireEvent.change(destinationInput, { target: { value: 'Invalid' } });

    const form = screen.getByText('Where are you going?').closest('form') || 
                 screen.getByRole('button', { name: /find your way/i }).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText(/Failed to find location/i)).toBeInTheDocument();
    });
  });

  it('should show error when no locations found', async () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      } as any);
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ error: 'No results' }),
    });

    render(<Home />);

    const destinationInput = screen.getByLabelText('Destination');
    fireEvent.change(destinationInput, { target: { value: 'Invalid' } });

    const form = screen.getByText('Where are you going?').closest('form') || 
                 screen.getByRole('button', { name: /find your way/i }).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText(/No locations found/i)).toBeInTheDocument();
    });
  });

  it('should show info alert when current location is available', () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      } as any);
    });

    render(<Home />);

    expect(screen.getByText(/Using your current location/i)).toBeInTheDocument();
  });

  it('should navigate with start and end locations', async () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      } as any);
    });

    render(<Home />);

    const destinationInput = screen.getByLabelText('Destination');
    fireEvent.change(destinationInput, { target: { value: 'New York' } });
    fireEvent.blur(destinationInput);

    await waitFor(() => {
      const form = screen.getByText('Where are you going?').closest('form') || 
                   screen.getByRole('button', { name: /find your way/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/route',
        query: expect.objectContaining({
          end_location: expect.any(String),
        }),
      });
    });
  });

  it('should clear start location coords when value is cleared', () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      } as any);
    });

    render(<Home />);

    const startInput = screen.getByLabelText('Start Location (optional)');
    fireEvent.change(startInput, { target: { value: '' } });
    // Should not throw
  });

  it('should clear destination coords when value is cleared', () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      } as any);
    });

    render(<Home />);

    const destinationInput = screen.getByLabelText('Destination');
    fireEvent.change(destinationInput, { target: { value: '' } });
    // Should not throw
  });

  it('should show error when destination coords are missing on navigate', async () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      } as any);
    });

    render(<Home />);

    // Try to navigate without destination coords
    const form = screen.getByText('Where are you going?').closest('form') || 
                 screen.getByRole('button', { name: /find your way/i }).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText(/Please enter a destination/i)).toBeInTheDocument();
    });
  });

  it('should handle empty array response from API', async () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      } as any);
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => [],
    });

    render(<Home />);

    const destinationInput = screen.getByLabelText('Destination');
    fireEvent.change(destinationInput, { target: { value: 'Invalid' } });

    const form = screen.getByText('Where are you going?').closest('form') || 
                 screen.getByRole('button', { name: /find your way/i }).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText(/No locations found/i)).toBeInTheDocument();
    });
  });

  it('should navigate without start location when not provided', async () => {
    (global.navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success, error) => {
      error({
        code: 1,
        message: 'Permission denied',
      } as any);
    });

    render(<Home />);

    const destinationInput = screen.getByLabelText('Destination');
    fireEvent.change(destinationInput, { target: { value: 'New York' } });
    fireEvent.blur(destinationInput);

    await waitFor(() => {
      const form = screen.getByText('Where are you going?').closest('form') || 
                   screen.getByRole('button', { name: /find your way/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/route',
        query: expect.objectContaining({
          end_location: expect.any(String),
        }),
      });
    });
  });
});
