import { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
  Typography,
  Popper,
  ClickAwayListener,
} from '@mui/material';
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
    <Box sx={{ marginBottom: 2, position: 'relative' }}>
      <TextField
        inputRef={inputRef}
        id={id}
        fullWidth
        label={label}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        InputProps={{
          endAdornment: loadingSuggestions && value.length >= 3 ? (
            <CircularProgress size={20} />
          ) : null,
        }}
      />
      <Popper
        open={showSuggestions && suggestions.length > 0 && !!inputRef.current}
        anchorEl={inputRef.current}
        placement="bottom-start"
        style={{ zIndex: 1300, width: inputRef.current?.clientWidth }}
      >
        <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
          <Paper
            ref={suggestionsRef}
            sx={{
              maxHeight: 300,
              overflow: 'auto',
              width: '100%',
              mt: 0.5,
            }}
          >
            <List dense>
              {suggestions.map((location, index) => (
                <ListItem
                  key={index}
                  button
                  selected={selectedIndex === index}
                  onClick={() => handleLocationSelect(location)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" fontWeight="bold">
                        {location.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {location.formatted_address}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
