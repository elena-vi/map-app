import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { LocationResult } from '../lib/models';

export default function Home() {
  const router = useRouter();
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitDisabled, setSubmitDisabled] = useState<boolean>(false);
  const [buttonText, setButtonText] = useState<string>('Find your way');
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          setSubmitDisabled(false);
          setButtonText('Find your way');
          setError(''); // Clear any previous errors
        },
        (err) => {
          // Check the specific error code
          let errorMessage = 'Unable to get your location. Please enter your location manually.';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Geolocation permission was denied. Please enter your location manually.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please enter your location manually.';
              break;
            case err.TIMEOUT:
              errorMessage = 'Location request timed out. Please enter your location manually.';
              break;
            default:
              errorMessage = 'Unable to get your location. Please enter your location manually.';
              break;
          }
          
          setError(errorMessage);
          setSubmitDisabled(false);
          setButtonText('Find your way');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setError(
        'Geolocation is not supported by this browser. Please enter your location manually.'
      );
      setSubmitDisabled(false);
      setButtonText('Find your way');
    }
  }, []);

  // Fetch location suggestions with debouncing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (destination.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!latitude || !longitude) {
      return;
    }

    setLoadingSuggestions(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const currentLocation = `${latitude},${longitude}`;
        const response = await fetch(
          `/api/locations?destination=${encodeURIComponent(destination)}&currentLocation=${currentLocation}`
        );
        const data = await response.json();
        
        if (data.error) {
          setSuggestions([]);
        } else {
          setSuggestions(data);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [destination, latitude, longitude]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLocationSelect = (location: LocationResult) => {
    const endLocation = `${location.geometry.location.lat},${location.geometry.location.lng}`;
    const currentLocation = `${latitude},${longitude}`;
    setShowSuggestions(false);
    setDestination(location.name);
    router.push({
      pathname: '/route',
      query: {
        start_location: currentLocation,
        end_location: endLocation,
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleLocationSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (latitude && longitude && destination) {
      // If there are suggestions available, use the first one
      if (suggestions.length > 0) {
        handleLocationSelect(suggestions[0]);
        return;
      }

      // Otherwise, fetch locations and use the first result
      try {
        setSubmitDisabled(true);
        setButtonText('Finding location...');
        const currentLocation = `${latitude},${longitude}`;
        const response = await fetch(
          `/api/locations?destination=${encodeURIComponent(destination)}&currentLocation=${currentLocation}`
        );
        const data = await response.json();
        
        if (data.error || !data || data.length === 0) {
          setError('No locations found. Please try a different destination.');
          setSubmitDisabled(false);
          setButtonText('Find your way');
          return;
        }

        // Use the first result
        const firstLocation = data[0];
        const endLocation = `${firstLocation.geometry.location.lat},${firstLocation.geometry.location.lng}`;
        const currentLocationStr = `${latitude},${longitude}`;
        router.push({
          pathname: '/route',
          query: {
            start_location: currentLocationStr,
            end_location: endLocation,
          },
        });
      } catch (err) {
        setError('Failed to find location. Please try again.');
        setSubmitDisabled(false);
        setButtonText('Find your way');
      }
    }
  };

  return (
    <>
      <Head>
        <title>Map App - Find Your Way</title>
      </Head>
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h3>Where are you going?</h3>
        {error && <strong style={{ color: 'red' }}>{error}</strong>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: error ? 'block' : 'none', marginBottom: '15px' }}>
            <label htmlFor="latitude">Your latitude</label>
            <input
              type="text"
              id="latitude"
              name="latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '10px' }}
            />
            <label htmlFor="longitude">Your longitude</label>
            <input
              type="text"
              id="longitude"
              name="longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px', position: 'relative' }}>
            <label htmlFor="destination">Destination</label>
            <input
              ref={inputRef}
              id="destination"
              type="text"
              name="destination"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginTop: '4px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {suggestions.map((location, index) => (
                  <div
                    key={index}
                    onClick={() => handleLocationSelect(location)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      backgroundColor:
                        selectedIndex === index ? '#f0f0f0' : 'white',
                      borderBottom:
                        index < suggestions.length - 1
                          ? '1px solid #eee'
                          : 'none',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {location.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {location.formatted_address}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {loadingSuggestions && destination.length >= 3 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginTop: '4px',
                  padding: '12px',
                  zIndex: 1000,
                }}
              >
                <div style={{ color: '#666' }}>Loading suggestions...</div>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={submitDisabled}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: submitDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </>
  );
}
