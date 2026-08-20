import React from 'react';
import { render, screen } from '@testing-library/react';
import ImportModal from '../ImportModal';

describe('ImportModal Component', () => {
  test('does not render when isOpen is false', () => {
    const { container } = render(<ImportModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders drag and drop file upload screen when open', () => {
    render(<ImportModal isOpen={true} />);
    expect(screen.getByText(/Import Excel \/ CSV Scenarios/i)).toBeInTheDocument();
    expect(screen.getByText(/Click or Drag Excel \/ CSV File Here/i)).toBeInTheDocument();
  });
});
