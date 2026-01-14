import { Route } from './models';

export class RouteFinder {
  private startLocation: string;
  private endLocation: string;

  constructor(startLocation: string, endLocation: string) {
    this.startLocation = startLocation;
    this.endLocation = endLocation;
  }

  async call(): Promise<Route> {
    const apiUrl =
      process.env.CITYMAPPER_API_URL ||
      'https://api.external.citymapper.com/api/1/directions/transit?';

    const params = new URLSearchParams({
      start: this.startLocation,
      end: this.endLocation,
      time: new Date().toISOString(),
      time_type: 'depart',
      language: 'en',
    });

    const url = `${apiUrl}${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        'Citymapper-Partner-Key': process.env.CITY_MAPPER_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Citymapper API error: ${response.statusText}`);
    }

    const route: Route = await response.json();
    return route;
  }

  static async call(
    startLocation: string,
    endLocation: string
  ): Promise<Route> {
    const finder = new RouteFinder(startLocation, endLocation);
    return finder.call();
  }
}

