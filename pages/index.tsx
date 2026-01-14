import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Container,
  Typography,
  Button,
  Alert,
  Box,
  Paper,
} from '@mui/material';
import { LocationResult } from '../lib/models';
import LocationPicker from '../components/LocationPicker';

export default function Home() {
  const router = useRouter();
  const [startLocation, setStartLocation] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [startLocationCoords, setStartLocationCoords] = useState<{ lat: string; lng: string } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: string; lng: string } | null>(null);
  const [error, setError] = useState<string>('');
  const [submitDisabled, setSubmitDisabled] = useState<boolean>(false);
  const [buttonText, setButtonText] = useState<string>('Find your way');
  const [currentLocationAvailable, setCurrentLocationAvailable] = useState<boolean>(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setStartLocationCoords({
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString()
          });
          setCurrentLocationAvailable(true);
          setSubmitDisabled(false);
          setButtonText('Find your way');
          setError(''); // Clear any previous errors
        },
        (err) => {
          setCurrentLocationAvailable(false);
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
      setCurrentLocationAvailable(false);
      setSubmitDisabled(false);
      setButtonText('Find your way');
    }
  }, []);


  const handleStartLocationSelect = (location: LocationResult) => {
    setStartLocationCoords({
      lat: location.geometry.location.lat.toString(),
      lng: location.geometry.location.lng.toString()
    });
  };

  const handleDestinationSelect = (location: LocationResult) => {
    setDestinationCoords({
      lat: location.geometry.location.lat.toString(),
      lng: location.geometry.location.lng.toString()
    });
  };

  const navigateToRoute = () => {
    if (!destinationCoords) {
      setError('Please select a destination.');
      return;
    }

    const endLocation = `${destinationCoords.lat},${destinationCoords.lng}`;
    const query: any = {
      end_location: endLocation,
    };
    
    if (startLocationCoords) {
      query.start_location = `${startLocationCoords.lat},${startLocationCoords.lng}`;
    }
    
    router.push({
      pathname: '/route',
      query,
    });
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // If destination is selected, navigate directly
    if (destinationCoords) {
      navigateToRoute();
      return;
    }

    if (!destination) {
      setError('Please enter a destination.');
      return;
    }

    // Otherwise, fetch destination locations and use the first result
    try {
      setSubmitDisabled(true);
      setButtonText('Finding location...');
      const currentLocation = startLocationCoords ? `${startLocationCoords.lat},${startLocationCoords.lng}` : undefined;
      const url = currentLocation
        ? `/api/locations?destination=${encodeURIComponent(destination)}&currentLocation=${currentLocation}`
        : `/api/locations?destination=${encodeURIComponent(destination)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error || !data || data.length === 0) {
        setError('No locations found. Please try a different destination.');
        setSubmitDisabled(false);
        setButtonText('Find your way');
        return;
      }

      // Use the first result
      handleDestinationSelect(data[0]);
      setTimeout(() => navigateToRoute(), 100);
    } catch (err) {
      setError('Failed to find location. Please try again.');
      setSubmitDisabled(false);
      setButtonText('Find your way');
    }
  };

  return (
    <>
      <Head>
        <title>YAMA | Find Your Way</title>
        <meta name="description" content="YAMA (Yet Another Map App) helps you find the best transit routes and directions. Plan your journey with real-time public transportation information." />
        <meta name="keywords" content="yama, yet another map app, transit routes, public transportation, directions, route planner, map directions" />
        <meta property="og:title" content="YAMA - Yet Another Map App | Find Your Way" />
        <meta property="og:description" content="Plan your journey with YAMA. Find the best transit routes and directions with real-time public transportation information." />
        <meta property="og:url" content="https://your-domain.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "YAMA",
              "alternateName": "Yet Another Map App",
              "description": "Find the best transit routes and directions with real-time public transportation information",
              "url": "https://your-domain.com",
              "applicationCategory": "TravelApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            }),
          }}
        />
      </Head>
      <Container maxWidth="sm">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Where are you going?
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {currentLocationAvailable && !startLocation && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Using your current location as starting point (or enter a start location below)
            </Alert>
          )}
          <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
            <form onSubmit={handleSubmit}>
              <LocationPicker
                id="startLocation"
                value={startLocation}
                onChange={(value) => {
                  setStartLocation(value);
                  if (value === '') {
                    setStartLocationCoords(null);
                  }
                }}
                onLocationSelect={handleStartLocationSelect}
                label="Start Location (optional)"
                placeholder="Enter start location or leave blank to use current location"
                required={false}
              />
              <LocationPicker
                id="destination"
                value={destination}
                onChange={(value) => {
                  setDestination(value);
                  if (value === '') {
                    setDestinationCoords(null);
                  }
                }}
                onLocationSelect={handleDestinationSelect}
                label="Destination"
                placeholder="Enter destination"
                required={true}
                currentLocation={
                  startLocationCoords
                    ? `${startLocationCoords.lat},${startLocationCoords.lng}`
                    : undefined
                }
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitDisabled}
                size="large"
                sx={{ mt: 2 }}
              >
                {buttonText}
              </Button>
            </form>
          </Paper>
        </Box>
      </Container>
    </>
  );
}
