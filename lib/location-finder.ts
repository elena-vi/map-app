import { Locations, LocationResult } from './models';

export class LocationFinder {
  private location: string;
  private currentLocation?: string;

  constructor(location: string, currentLocation?: string) {
    this.location = location;
    this.currentLocation = currentLocation;
  }

  async call(): Promise<LocationResult[]> {
    const placesApi =
      process.env.PLACES_API ||
      'https://maps.googleapis.com/maps/api/place/textsearch/json?';

    const params = new URLSearchParams({
      query: this.location,
      fields: 'formatted_address,name,geometry',
      key: process.env.GOOGLE_MAPS_KEY || '',
    });

    // Only add location bias if currentLocation is provided
    if (this.currentLocation) {
      params.append('location', this.currentLocation);
    }

    const url = `${placesApi}${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data: Locations = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(
        data.error_message || `API returned status: ${data.status}`
      );
    }

    return data.results.map((result) => ({
      formatted_address: result.formatted_address,
      geometry: result.geometry,
      name: result.name,
    }));
  }

  static async call(
    location: string,
    currentLocation?: string
  ): Promise<LocationResult[]> {
    const finder = new LocationFinder(location, currentLocation);
    return finder.call();
  }
}

