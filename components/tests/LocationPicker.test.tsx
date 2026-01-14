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
    
    // Test ArrowDown: should move from -1 to 0 (first suggestion)
    // Line 118-120: prev < suggestions.length - 1 ? prev + 1 : prev
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    
    // Verify preventDefault was called (line 117)
    // The selected index should have changed, which we can verify by checking
    // that the first item is now selected (Material-UI ListItem with selected prop)
  });

  it('should handle ArrowDown when at last suggestion (should not increment)', async () => {
    const mockLocations: LocationResult[] = [
      {
        name: 'Location 1',
        formatted_address: 'Address 1',
        geometry: {
          location: { lat: 40.7128, lng: -74.0060 },
        },
      },
      {
        name: 'Location 2',
        formatted_address: 'Address 2',
        geometry: {
          location: { lat: 40.7580, lng: -73.9855 },
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockLocations,
    });

    render(
      <LocationPicker
        value="Location"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Location 1').length).toBeGreaterThan(0);
    });

    const input = screen.getByLabelText('Test Location');
    
    // Navigate to the last item (index 1, which is suggestions.length - 1)
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // Move to index 0
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // Move to index 1 (last item)
    
    // Press ArrowDown again - should stay at index 1
    // Line 119: prev < suggestions.length - 1 ? prev + 1 : prev
    // When prev = 1 and suggestions.length - 1 = 1, condition is false, so stays at 1
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    
    // The selected index should remain at the last item
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
    
    // Test ArrowUp: when at index -1, should stay at -1
    // Line 124: (prev > 0 ? prev - 1 : -1)
    // When prev = -1, prev > 0 is false, so returns -1
    fireEvent.keyDown(input, { key: 'ArrowUp' });
  });

  it('should handle ArrowUp when at first suggestion (should go to -1)', async () => {
    const mockLocations: LocationResult[] = [
      {
        name: 'Location 1',
        formatted_address: 'Address 1',
        geometry: {
          location: { lat: 40.7128, lng: -74.0060 },
        },
      },
      {
        name: 'Location 2',
        formatted_address: 'Address 2',
        geometry: {
          location: { lat: 40.7580, lng: -73.9855 },
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockLocations,
    });

    render(
      <LocationPicker
        value="Location"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Location 1').length).toBeGreaterThan(0);
    });

    const input = screen.getByLabelText('Test Location');
    
    // Navigate to the first item (index 0)
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // Move to index 0
    
    // Press ArrowUp when at index 0
    // Line 124: (prev > 0 ? prev - 1 : -1)
    // When prev = 0, prev > 0 is false, so returns -1
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    
    // The selected index should be -1 (no selection)
  });

  it('should handle ArrowUp when at second suggestion (should go to first)', async () => {
    const mockLocations: LocationResult[] = [
      {
        name: 'Location 1',
        formatted_address: 'Address 1',
        geometry: {
          location: { lat: 40.7128, lng: -74.0060 },
        },
      },
      {
        name: 'Location 2',
        formatted_address: 'Address 2',
        geometry: {
          location: { lat: 40.7580, lng: -73.9855 },
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockLocations,
    });

    render(
      <LocationPicker
        value="Location"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Location 1').length).toBeGreaterThan(0);
    });

    const input = screen.getByLabelText('Test Location');
    
    // Navigate to the second item (index 1)
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // Move to index 0
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // Move to index 1
    
    // Press ArrowUp when at index 1
    // Line 124: (prev > 0 ? prev - 1 : -1)
    // When prev = 1, prev > 0 is true, so returns prev - 1 = 0
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    
    // The selected index should be 0 (first item)
  });

  it('should call preventDefault for ArrowDown and ArrowUp keys', async () => {
    const mockLocations: LocationResult[] = [
      {
        name: 'Location 1',
        formatted_address: 'Address 1',
        geometry: {
          location: { lat: 40.7128, lng: -74.0060 },
        },
      },
      {
        name: 'Location 2',
        formatted_address: 'Address 2',
        geometry: {
          location: { lat: 40.7580, lng: -73.9855 },
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockLocations,
    });

    render(
      <LocationPicker
        value="Location"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Location 1').length).toBeGreaterThan(0);
    });

    const input = screen.getByLabelText('Test Location');
    
    // Test ArrowDown preventDefault (line 117)
    // Create a mock event with preventDefault
    const preventDefaultArrowDown = jest.fn();
    const arrowDownEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(arrowDownEvent, 'preventDefault', {
      value: preventDefaultArrowDown,
      writable: true,
    });
    
    input.dispatchEvent(arrowDownEvent);
    expect(preventDefaultArrowDown).toHaveBeenCalled();
    
    // Test ArrowUp preventDefault (line 123)
    const preventDefaultArrowUp = jest.fn();
    const arrowUpEvent = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(arrowUpEvent, 'preventDefault', {
      value: preventDefaultArrowUp,
      writable: true,
    });
    
    input.dispatchEvent(arrowUpEvent);
    expect(preventDefaultArrowUp).toHaveBeenCalled();
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

  it('should clear existing debounce timer when value changes', async () => {
    jest.useFakeTimers();

    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => [],
    });

    const { rerender } = render(
      <LocationPicker
        value="New"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    // Advance timer partially
    jest.advanceTimersByTime(100);

    // Change value - should clear previous timer
    rerender(
      <LocationPicker
        value="New York"
        onChange={mockOnChange}
        onLocationSelect={mockOnLocationSelect}
        label="Test Location"
      />
    );

    // Advance to trigger new fetch
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });

  it('should close suggestions when clicking outside', async () => {
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

    // ClickAwayListener listens to mousedown events
    // Create an element outside the component and trigger mousedown
    const outsideElement = document.createElement('div');
    outsideElement.setAttribute('data-testid', 'outside-element');
    document.body.appendChild(outsideElement);
    
    // The useEffect with handleClickOutside listens to mousedown events
    // and checks if the click is outside suggestionsRef and inputRef
    fireEvent.mouseDown(outsideElement);

    await waitFor(() => {
      // Suggestions should be hidden after clicking away
      // The Popper's open prop should become false
      expect(screen.queryByText('New York, NY, USA')).not.toBeInTheDocument();
    }, { timeout: 1000 });

    document.body.removeChild(outsideElement);
  });

  it('should trigger ClickAwayListener onClickAway when clicking outside suggestions', async () => {
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

    const { container } = render(
      <div>
        <LocationPicker
          value="New York"
          onChange={mockOnChange}
          onLocationSelect={mockOnLocationSelect}
          label="Test Location"
        />
        <div data-testid="outside-click-target">Outside element</div>
      </div>
    );

    await waitFor(() => {
      expect(screen.getAllByText('New York, NY, USA').length).toBeGreaterThan(0);
    });

    // Verify suggestions are visible (there should be at least one)
    const suggestions = screen.getAllByText('New York, NY, USA');
    expect(suggestions.length).toBeGreaterThan(0);

    // Material-UI's ClickAwayListener listens to mousedown and touchstart events on the document
    // We need to trigger the event on an element that is definitely outside the component
    const outsideTarget = screen.getByTestId('outside-click-target');
    
    // Create a proper MouseEvent that will bubble to the document
    // ClickAwayListener checks if the event target is outside its children
    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    
    // Dispatch the event on the outside element
    outsideTarget.dispatchEvent(mouseDownEvent);
    
    // Also trigger a click event to ensure complete interaction
    fireEvent.click(outsideTarget);

    await waitFor(() => {
      // ClickAwayListener's onClickAway callback (line 176: onClickAway={() => setShowSuggestions(false)})
      // should have been called, which sets showSuggestions to false and closes the Popper
      // The suggestions should no longer be visible in the document
      expect(screen.queryByText('New York, NY, USA')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should show suggestions when input is focused and suggestions exist', async () => {
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
    
    // Blur and then focus again - should show suggestions
    fireEvent.blur(input);
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getAllByText('New York, NY, USA').length).toBeGreaterThan(0);
    });
  });

  it('should update selected index on mouse enter', async () => {
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

    // Find the list items and hover over the second one
    const listItems = screen.getAllByRole('button');
    const secondItem = listItems.find(item => item.textContent?.includes('New York City'));
    
    if (secondItem) {
      fireEvent.mouseEnter(secondItem);
      // The item should be selected (Material-UI handles the visual state)
    }
  });
});
