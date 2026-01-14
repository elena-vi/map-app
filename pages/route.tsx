import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import {
  Container,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import { Route, RouteOption } from '../lib/models';

export default function RoutePage() {
  const router = useRouter();
  const { start_location, end_location } = router.query;
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);

  // Get current location if start_location is not provided
  useEffect(() => {
    if (!start_location && end_location && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = `${position.coords.latitude},${position.coords.longitude}`;
          setCurrentLocation(location);
        },
        (err) => {
          setError('Unable to get your current location. Please provide a start location.');
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else if (!start_location && !end_location) {
      setError('Missing required parameters');
      setLoading(false);
    }
  }, [start_location, end_location]);

  // Fetch route when we have both locations
  useEffect(() => {
    const startLoc = start_location as string || currentLocation;
    if (startLoc && end_location) {
      fetch(
        `/api/route?start_location=${encodeURIComponent(startLoc)}&end_location=${encodeURIComponent(end_location as string)}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setRoute(data);
          }
          setLoading(false);
        })
        .catch((err) => {
          setError('Failed to fetch route');
          setLoading(false);
        });
    }
  }, [start_location, end_location, currentLocation]);

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading route...</title>
        </Head>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Error</title>
        </Head>
        <Container maxWidth="md">
          <Box sx={{ mt: 4 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        </Container>
      </>
    );
  }

  if (!route || !route.routes || route.routes.length === 0) {
    return (
      <>
        <Head>
          <title>No routes found</title>
        </Head>
        <Container maxWidth="md">
          <Box sx={{ mt: 4 }}>
            <Alert severity="info">No routes found for this journey.</Alert>
          </Box>
        </Container>
      </>
    );
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} sec`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  const getTravelModeLabel = (mode: string): string => {
    const modeMap: { [key: string]: string } = {
      'TRANSIT': 'Transit',
      'WALKING': 'Walk',
      'DRIVE': 'Drive',
      'BICYCLE': 'Bike',
    };
    return modeMap[mode] || mode;
  };

  const getTravelModeIcon = (mode: string) => {
    switch (mode) {
      case 'TRANSIT':
        return <DirectionsTransitIcon />;
      case 'WALKING':
        return <DirectionsWalkIcon />;
      case 'DRIVE':
        return <DirectionsCarIcon />;
      case 'BICYCLE':
        return <DirectionsBikeIcon />;
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Route Options | YAMA - Yet Another Map App</title>
        <meta name="description" content="View detailed transit route options with YAMA. Compare routes, arrival times, and prices for your journey." />
        <meta name="keywords" content="yama, yet another map app, transit routes, route options, public transportation, directions" />
        <meta property="og:title" content="Route Options | YAMA" />
        <meta property="og:description" content="View detailed transit route options with arrival times and pricing." />
      </Head>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Route Options
          </Typography>
          {route.routes.map((routeOption: RouteOption, index: number) => (
            <Accordion key={index} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      Duration: {formatDuration(routeOption.duration_seconds)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Arrival: {formatTime(routeOption.route_arrival_time)}
                    </Typography>
                  </Box>
                  <Chip
                    label={`Price: ${routeOption.price?.formatted || 'N/A'}`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="h6" gutterBottom>
                  Route Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {routeOption.legs?.map((leg, legIndex) => (
                  <Paper key={legIndex} elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {getTravelModeIcon(leg.travel_mode || leg.travelMode)}
                      <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold' }}>
                        Leg {legIndex + 1}: {getTravelModeLabel(leg.travel_mode || leg.travelMode)}
                      </Typography>
                      {leg.duration && (
                        <Chip
                          label={formatDuration(typeof leg.duration === 'string' ? parseInt(leg.duration.replace('s', '')) : leg.duration)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                    {leg.steps && leg.steps.length > 0 ? (
                      <List>
                        {leg.steps.map((step: any, stepIndex: number) => (
                          <ListItem key={stepIndex} sx={{ borderLeft: '3px solid', borderColor: 'primary.main', pl: 2, mb: 1 }}>
                            {step.transitDetails ? (
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="subtitle2" fontWeight="bold" color="primary">
                                    {step.transitDetails.transitLine?.name || 'Transit'}
                                  </Typography>
                                  {step.transitDetails.transitLine?.color && (
                                    <Box
                                      sx={{
                                        width: 20,
                                        height: 20,
                                        backgroundColor: `#${step.transitDetails.transitLine.color}`,
                                        ml: 1,
                                        borderRadius: 1,
                                      }}
                                      title={step.transitDetails.transitLine.name}
                                    />
                                  )}
                                </Box>
                                {step.transitDetails.headsign && (
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Direction: {step.transitDetails.headsign}
                                  </Typography>
                                )}
                                {step.transitDetails.stopDetails?.departureStop && (
                                  <Typography variant="body2">
                                    <strong>Depart:</strong> {step.transitDetails.stopDetails.departureStop.name}
                                    {step.transitDetails.stopDetails.departureTime && (
                                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                        at {formatTime(step.transitDetails.stopDetails.departureTime)}
                                      </Typography>
                                    )}
                                  </Typography>
                                )}
                                {step.transitDetails.stopDetails?.arrivalStop && (
                                  <Typography variant="body2">
                                    <strong>Arrive:</strong> {step.transitDetails.stopDetails.arrivalStop.name}
                                    {step.transitDetails.stopDetails.arrivalTime && (
                                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                        at {formatTime(step.transitDetails.stopDetails.arrivalTime)}
                                      </Typography>
                                    )}
                                  </Typography>
                                )}
                                {step.transitDetails.stopCount && step.transitDetails.stopCount > 0 && (
                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    {step.transitDetails.stopCount} stop{step.transitDetails.stopCount !== 1 ? 's' : ''}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  {getTravelModeIcon(step.travelMode || step.travel_mode || 'WALKING')}
                                  <Typography variant="subtitle2" fontWeight="bold" sx={{ ml: 1 }}>
                                    {getTravelModeLabel(step.travelMode || step.travel_mode || 'WALKING')}
                                  </Typography>
                                  {step.duration && (
                                    <Chip
                                      label={formatDuration(typeof step.duration === 'string' ? parseInt(step.duration.replace('s', '')) : step.duration)}
                                      size="small"
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </Box>
                                {step.instructions && (
                                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                    {step.instructions}
                                  </Typography>
                                )}
                                {step.distanceMeters && (
                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    {Math.round(step.distanceMeters)}m
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        No step details available
                      </Typography>
                    )}
                  </Paper>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </>
  );
}
