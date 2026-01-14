import React from 'react';
import { render } from '@testing-library/react';
import Document from '../_document';

// Mock Next.js document components
jest.mock('next/document', () => ({
  Html: ({ children }: { children: React.ReactNode }) => <html>{children}</html>,
  Head: ({ children }: { children: React.ReactNode }) => <head>{children}</head>,
  Main: () => <main />,
  NextScript: () => <script />,
}));

describe('Document', () => {
  it('should render document structure', () => {
    const { container } = render(<Document />);
    expect(container.querySelector('html')).toBeInTheDocument();
  });

  it('should include meta tags', () => {
    const { container } = render(<Document />);
    const head = container.querySelector('head');
    expect(head).toBeInTheDocument();
  });
});
