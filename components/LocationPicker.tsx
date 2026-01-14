import { useState, useEffect, useRef } from 'react';
import { LocationResult } from '../lib/models';

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: LocationResult) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
  currentLocation?: string; // For biasing search results (format: "lat,lng")
  id?: string;
}

export default function LocationPicker({
  value,
  onChange,
  onLocationSelect,
  label,
  placeholder = 'Enter location',
  required = false,
  currentLocation,
  id,
}: LocationPickerProps) {
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch location suggestions with debouncing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const url = currentLocation
          ? `/api/locations?destination=${encodeURIComponent(value)}&currentLocation=${currentLocation}`
          : `/api/locations?destination=${encodeURIComponent(value)}`;
        const response = await fetch(url);
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
  }, [value, currentLocation]);

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
    onChange(location.name);
    onLocationSelect(location);
    setShowSuggestions(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div style={{ marginBottom: '15px', position: 'relative' }}>
      <label htmlFor={id}>{label}</label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        required={required}
        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        autoComplete="off"
        placeholder={placeholder}
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
      {loadingSuggestions && value.length >= 3 && (
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
  );
}
