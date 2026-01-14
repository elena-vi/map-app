import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';

describe('Header', () => {
  it('should render header with logo and title', () => {
    render(<Header darkMode={false} onToggleDarkMode={jest.fn()} />);
    
    expect(screen.getByText('YAMA')).toBeInTheDocument();
    expect(screen.getByText('Yet Another Map App')).toBeInTheDocument();
  });

  it('should render dark mode icon when darkMode is false', () => {
    render(<Header darkMode={false} onToggleDarkMode={jest.fn()} />);
    
    const button = screen.getByLabelText('toggle dark mode');
    expect(button).toBeInTheDocument();
  });

  it('should call onToggleDarkMode when icon button is clicked', () => {
    const mockToggle = jest.fn();
    render(<Header darkMode={false} onToggleDarkMode={mockToggle} />);
    
    const button = screen.getByLabelText('toggle dark mode');
    fireEvent.click(button);
    
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('should render with darkMode true', () => {
    render(<Header darkMode={true} onToggleDarkMode={jest.fn()} />);
    
    expect(screen.getByText('YAMA')).toBeInTheDocument();
    const button = screen.getByLabelText('toggle dark mode');
    expect(button).toBeInTheDocument();
  });
});
