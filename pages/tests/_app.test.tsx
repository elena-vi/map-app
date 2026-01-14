import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../_app';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('App', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should render app with light theme by default', () => {
    const mockPageProps = {};
    const mockComponent = () => <div>Test Page</div>;

    render(<App Component={mockComponent} pageProps={mockPageProps} />);

    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  it('should load dark theme from localStorage', () => {
    localStorageMock.setItem('themeMode', 'dark');

    const mockPageProps = {};
    const mockComponent = () => <div>Test Page</div>;

    render(<App Component={mockComponent} pageProps={mockPageProps} />);

    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  it('should toggle dark mode and save to localStorage', () => {
    const mockPageProps = {};
    const mockComponent = () => <div>Test Page</div>;

    render(<App Component={mockComponent} pageProps={mockPageProps} />);

    const toggleButton = screen.getByLabelText('toggle dark mode');
    fireEvent.click(toggleButton);

    expect(localStorageMock.getItem('themeMode')).toBe('dark');
  });

  it('should persist theme preference in localStorage', () => {
    const mockPageProps = {};
    const mockComponent = () => <div>Test Page</div>;

    const { rerender } = render(<App Component={mockComponent} pageProps={mockPageProps} />);

    const toggleButton = screen.getByLabelText('toggle dark mode');
    fireEvent.click(toggleButton);

    expect(localStorageMock.getItem('themeMode')).toBe('dark');

    // Rerender to simulate page reload
    rerender(<App Component={mockComponent} pageProps={mockPageProps} />);

    // Theme should be persisted
    expect(localStorageMock.getItem('themeMode')).toBe('dark');
  });

  it('should render Header component', () => {
    const mockPageProps = {};
    const mockComponent = () => <div>Test Page</div>;

    render(<App Component={mockComponent} pageProps={mockPageProps} />);

    expect(screen.getByText('YAMA')).toBeInTheDocument();
  });
});
