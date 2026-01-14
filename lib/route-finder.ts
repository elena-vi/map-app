import { Route, RouteOption, RouteLeg, RoutePrice } from './models';

export class RouteFinder {
  private startLocation: string;
  private endLocation: string;

  constructor(startLocation: string, endLocation: string) {
    this.startLocation = startLocation;
    this.endLocation = endLocation;
  }

  private parseLocation(location: string): { latitude: number; longitude: number } {
    const [lat, lng] = location.split(',').map(Number);
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error(`Invalid location format: ${location}. Expected format: "lat,lng"`);
    }
    return { latitude: lat, longitude: lng };
  }

  private transformGoogleRouteToRouteOption(googleRoute: any): RouteOption {
    // Parse duration (format: "3600s" or number of seconds)
    let durationSeconds = 0;
    if (googleRoute.duration) {
      if (typeof googleRoute.duration === 'string') {
        durationSeconds = parseInt(googleRoute.duration.replace('s', '')) || 0;
      } else if (typeof googleRoute.duration === 'number') {
        durationSeconds = googleRoute.duration;
      }
    }

    // Get arrival time from the last leg, or calculate from departure time + duration
    let arrivalTime = new Date(Date.now() + durationSeconds * 1000).toISOString();
    if (googleRoute.legs && googleRoute.legs.length > 0) {
      const lastLeg = googleRoute.legs[googleRoute.legs.length - 1];
      if (lastLeg.arrivalTime) {
        arrivalTime = lastLeg.arrivalTime;
      } else if (lastLeg.departureTime) {
        // Calculate arrival from departure + leg duration
        const legDuration = lastLeg.duration 
          ? (typeof lastLeg.duration === 'string' 
              ? parseInt(lastLeg.duration.replace('s', '')) 
              : lastLeg.duration) 
          : 0;
        const departure = new Date(lastLeg.departureTime);
        arrivalTime = new Date(departure.getTime() + legDuration * 1000).toISOString();
      }
    }

    // Transform legs
    const legs: RouteLeg[] = (googleRoute.legs || []).map((leg: any) => {
      const travelMode = leg.travelMode || leg.travel_mode || 'TRANSIT';
      return {
        ...leg,
        travel_mode: travelMode,
      };
    });

    // Extract price information if available
    // Google Routes API v2 stores fare in travelAdvisory.transitFare or localizedValues.transitFare
    const transitFare = googleRoute.travelAdvisory?.transitFare || googleRoute.localizedValues?.transitFare;
    const price: RoutePrice = transitFare
      ? { 
          formatted: transitFare.text || 
                     (transitFare.value !== undefined && transitFare.value !== null 
                       ? `${transitFare.currencyCode || ''} ${transitFare.value}`.trim() 
                       : 'N/A'),
          ...transitFare 
        }
      : { formatted: 'N/A' };

    return {
      ...googleRoute,
      route_arrival_time: arrivalTime,
      duration_seconds: durationSeconds,
      price,
      legs,
    };
  }

  async call(): Promise<Route> {
    const apiKey = process.env.GOOGLE_ROUTES_API_KEY || process.env.GOOGLE_MAPS_KEY;
    if (!apiKey) {
      throw new Error('Google Routes API key is required. Set GOOGLE_ROUTES_API_KEY or GOOGLE_MAPS_KEY environment variable.');
    }

    const apiUrl = process.env.GOOGLE_ROUTES_API_URL || 
      'https://routes.googleapis.com/directions/v2:computeRoutes';

    const startCoords = this.parseLocation(this.startLocation);
    const endCoords = this.parseLocation(this.endLocation);

    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: startCoords.latitude,
            longitude: startCoords.longitude,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: endCoords.latitude,
            longitude: endCoords.longitude,
          },
        },
      },
      travelMode: 'TRANSIT',
      departureTime: new Date().toISOString(),
      computeAlternativeRoutes: true,
      transitPreferences: {
        routingPreference: 'FEWER_TRANSFERS',
      },
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.legs,routes.travelAdvisory.transitFare,routes.localizedValues.transitFare,routes.polyline,routes.legs.duration,routes.legs.distanceMeters,routes.legs.startLocation,routes.legs.endLocation',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Routes API error: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const googleResponse = await response.json();
    
    // Transform Google Routes API response to match existing Route model
    const routes: RouteOption[] = (googleResponse.routes || []).map((route: any) =>
      this.transformGoogleRouteToRouteOption(route)
    );

    return {
      routes,
      language: 'en',
    };
  }

  static async call(
    startLocation: string,
    endLocation: string
  ): Promise<Route> {
    const finder = new RouteFinder(startLocation, endLocation);
    return finder.call();
  }
}

