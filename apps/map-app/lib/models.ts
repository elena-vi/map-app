// Location Result Model
export interface LocationResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string;
}

// Locations Response Model
export interface Locations {
  html_attributions: string[];
  results: LocationResult[];
  status: string;
  error_message?: string;
  info_messages?: string[];
  next_page_token?: string;
}

// Route Leg Model
export interface RouteLeg {
  travel_mode: string;
  // Allow additional properties without strict typing
  [key: string]: any;
}

// Route Price Model
export interface RoutePrice {
  formatted: string;
  [key: string]: any;
}

// Route Model
export interface RouteOption {
  route_arrival_time: string;
  duration_seconds: number;
  price: RoutePrice;
  legs: RouteLeg[];
  [key: string]: any;
}

// Route Response Model
export interface Route {
  routes: RouteOption[];
  language: string;
  [key: string]: any;
}

