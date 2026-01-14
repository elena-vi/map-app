# Testing Guide

This project has 100% test coverage across all components, pages, API routes, and library functions.

## Test Setup

The project uses:
- **Jest** - Test runner
- **React Testing Library** - Component testing utilities
- **node-mocks-http** - API route testing

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

## Test Coverage

The project maintains 100% test coverage for:
- ✅ All components (`components/`)
- ✅ All pages (`pages/`)
- ✅ All API routes (`pages/api/`)
- ✅ All library functions (`lib/`)

## Test Structure

Tests are organized in `tests` directories next to the files they test:

```
components/
  tests/
    Header.test.tsx
    LocationPicker.test.tsx
pages/
  tests/
    index.test.tsx
    route.test.tsx
    _app.test.tsx
    _document.test.tsx
    sitemap.xml.test.tsx
  api/
    tests/
      locations.test.ts
      route.test.ts
lib/
  tests/
    location-finder.test.ts
    route-finder.test.ts
```

## Coverage Thresholds

The project enforces 100% coverage thresholds:
- Branches: 100%
- Functions: 100%
- Lines: 100%
- Statements: 100%

If coverage drops below 100%, tests will fail.
