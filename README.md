# Map App

A TypeScript/Next.js application for finding routes and destinations, migrated from a Rails application.

## Features

- Get current location using browser geolocation
- Search for destinations using Google Places API
- Find routes using Google Routes API for transit
- View route options with arrival time, duration, price, and travel legs

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory with your API keys and URLs:
```
# Google Maps API Configuration
GOOGLE_MAPS_KEY=your_google_maps_api_key_here
PLACES_API=https://maps.googleapis.com/maps/api/place/textsearch/json?

# Google Routes API Configuration (for transit directions)
# Note: GOOGLE_ROUTES_API_KEY is optional - if not set, GOOGLE_MAPS_KEY will be used
GOOGLE_ROUTES_API_KEY=your_google_routes_api_key_here
GOOGLE_ROUTES_API_URL=https://routes.googleapis.com/directions/v2:computeRoutes
```

You can copy `.env.example` to `.env.local` and fill in your actual API keys.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `apps/map-app/` - Next.js application
  - `pages/` - Next.js pages (index, new, route)
  - `pages/api/` - API routes for location and route services
  - `lib/` - Local TypeScript models and service classes for API calls

## Development

- Dev server: `npm run dev`
- Build: `npm run build`
- Start (production): `npm run start`
- Lint: `npm run lint`
