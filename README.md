# Map App

A TypeScript/Next.js application for finding routes and destinations, migrated from a Rails application.

## Features

- Get current location using browser geolocation
- Search for destinations using Google Places API
- Find routes using Citymapper API
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

# Citymapper API Configuration
CITY_MAPPER_KEY=your_citymapper_api_key_here
CITYMAPPER_API_URL=https://api.external.citymapper.com/api/1/directions/transit?
```

You can copy `.env.example` to `.env.local` and fill in your actual API keys.

3. Run the development server:
```bash
nx serve map-app
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `apps/map-app/` - Next.js application
  - `pages/` - Next.js pages (index, new, route)
  - `pages/api/` - API routes for location and route services
- `libs/models/` - TypeScript models/interfaces
- `libs/services/` - Service classes for API calls
- `legacy/` - Original Rails application (preserved for reference)

## Development

- Build: `nx build map-app`
- Serve: `nx serve map-app`
- Lint: `nx lint map-app`
