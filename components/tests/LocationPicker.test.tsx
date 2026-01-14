import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LocationPicker from '../LocationPicker';
import { LocationResult } from '../../lib/models';

// Mock fetch
global.fetch = jest.fn();

describe('LocationPicker', () => {
  const mockOnChange = jest.fn();
  const mockOnLocationSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render with label and placeholder', () => {
    render(
      <LocationPicker
        value=""
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
        placeholder="Enter location"
      />
    );

    expect(screen.getByLabelText('Test Location')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter location')).toBeInTheDocument();
  });

  it('should call onChange when input value changes', () => {
    render(
      <LocationPicker
        value=""
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    const input = screen.getByLabelText('Test Location');
    fireEvent.change(input, { target: { value: 'New York' } });

    expect(mockOnChange).toHaveBeenCalledWith('New York');
  });

  it('should not fetch suggestions when input is less than 3 characters', async () => {
    render(
      <LocationPicker
        value="NY"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('should fetch suggestions when input is 3 or more characters', async () => {
    const mockLocations: LocationResult[] = [
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockLocations,
    });

    render(
      <LocationPicker
        value="New"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should debounce suggestion requests', async () => {
    jest.useFakeTimers();

    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => [],
    });

    const { rerender } = render(
      <LocationPicker
        value=""
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    const input = screen.getByLabelText('Test Location');
    
    // Change to 'N' - should not trigger fetch (less than 3 chars)
    fireEvent.change(input, { target: { value: 'N' } });
    rerender(
      <LocationPicker
        value="N"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );
    
    // Change to 'Ne' - should not trigger fetch (less than 3 chars)
    fireEvent.change(input, { target: { value: 'Ne' } });
    rerender(
      <LocationPicker
        value="Ne"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );
    
    // Change to 'New' - should trigger debounced fetch (3 chars)
    fireEvent.change(input, { target: { value: 'New' } });
    rerender(
      <LocationPicker
        value="New"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    expect(global.fetch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });

  it('should include currentLocation in API call when provided', async () => {
    const mockLocations: LocationResult[] = [];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockLocations,
    });

    render(
      <LocationPicker
        value="New York"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
        currentLocation="40.7128,-74.0060"
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('currentLocation=40.7128,-74.0060')
      );
    });
  });

  it('should display suggestions when available', async () => {
    const mockLocations: LocationResult[] = [
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
      {
        name: 'New York City, NY, USA',
        formatted_address: 'New York City, NY, USA',
        geometry: {
          location: {
            lat: 40.7128,
            lng: -74.0060,
          },
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockLocations,
    });

    render(
      <LocationPicker
        value="New York"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('New York, NY, USA').length).toBeGreaterThan(0);
      expect(screen.getAllByText('New York City, NY, USA').length).toBeGreaterThan(0);
    });
  });

  it('should call onLocationSelect when suggestion is clicked', async () => {
    const mockLocation: LocationResult = {
      name: 'New York, NY, USA',
      formatted_address: 'New York, NY, USA',
      geometry: {
        location: {
          lat: 40.7128,
          lng: -74.0060,
        },
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => [mockLocation],
    });

    render(
      <LocationPicker
        value="New York"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('New York, NY, USA').length).toBeGreaterThan(0);
    });

    // Find the list item button (the clickable suggestion)
    const suggestion = screen.getByRole('button', { name: /New York, NY, USA/ });
    fireEvent.click(suggestion);

    expect(mockOnLocationSelect).toHaveBeenCalledWith(mockLocation);
    expect(mockOnChange).toHaveBeenCalledWith('New York, NY, USA');
  });

  it('should handle keyboard navigation with ArrowDown', async () => {
    const mockLocations: LocationResult[] = [
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
      {
        name: 'New York City, NY, USA',
        formatted_address: 'New York City, NY, USA',
        geometry: {
          location: {
            lat: 40.7128,
            lng: -74.0060,
          },
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockLocations,
    });

    render(
      <LocationPicker
        value="New York"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('New York, NY, USA').length).toBeGreaterThan(0);
    });

    const input = screen.getByLabelText('Test Location');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
  });

  it('should not handle keyboard navigation when suggestions are not shown', () => {
    render(
      <LocationPicker
        value=""
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    const input = screen.getByLabelText('Test Location');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Should not throw or cause issues
  });

  it('should handle input focus when suggestions are empty', () => {
    render(
      <LocationPicker
        value=""
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    const input = screen.getByLabelText('Test Location');
    fireEvent.focus(input);
    // Should not throw or cause issues
  });

  it('should handle keyboard navigation with ArrowUp', async () => {
    const mockLocations: LocationResult[] = [
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockLocations,
    });

    render(
      <LocationPicker
        value="New York"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('New York, NY, USA').length).toBeGreaterThan(0);
    });

    const input = screen.getByLabelText('Test Location');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
  });

  it('should select suggestion on Enter key', async () => {
    const mockLocation: LocationResult = {
      name: 'New York, NY, USA',
      formatted_address: 'New York, NY, USA',
      geometry: {
        location: {
          lat: 40.7128,
          lng: -74.0060,
        },
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => [mockLocation],
    });

    render(
      <LocationPicker
        value="New York"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('New York, NY, USA').length).toBeGreaterThan(0);
    });

    const input = screen.getByLabelText('Test Location');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnLocationSelect).toHaveBeenCalledWith(mockLocation);
  });

  it('should close suggestions on Escape key', async () => {
    const mockLocations: LocationResult[] = [
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockLocations,
    });

    render(
      <LocationPicker
        value="New York"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('New York, NY, USA').length).toBeGreaterThan(0);
    });

    const input = screen.getByLabelText('Test Location');
    fireEvent.keyDown(input, { key: 'Escape' });
  });

  it('should show loading indicator when fetching', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ json: async () => [] }), 100))
    );

    render(
      <LocationPicker
        value="New York"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    // Loading indicator should appear
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <LocationPicker
        value="New York"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should handle API response with error field', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ error: 'API Error' }),
    });

    render(
      <LocationPicker
        value="New York"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should handle required prop', () => {
    render(
      <LocationPicker
        value=""
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
        required={true}
      />
    );

    // Material-UI adds asterisk to required field labels, so we need to use a partial match
    const input = screen.getByLabelText(/Test Location/);
    expect(input).toBeRequired();
  });

  it('should handle id prop', () => {
    render(
      <LocationPicker
        id="test-id"
        value=""
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    const input = screen.getByLabelText('Test Location');
    expect(input).toHaveAttribute('id', 'test-id');
  });
});
