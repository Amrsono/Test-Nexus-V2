import React from 'react';
import { render, screen } from '@testing-library/react';
import BurndownPanel from '../BurndownPanel';

const mockBurndownData = [
  { label: 'W1', ideal: 100, actual: 95 },
  { label: 'W2', ideal: 80, actual: 75 },
  { label: 'W3', ideal: 60, actual: 50 },
];

const mockMeta = {
  total: 100,
  currentExecuted: 50,
  currentRemaining: 50,
  numWeeks: 8,
};

describe('BurndownPanel Component', () => {
  test('renders chart title and meta statistics', () => {
    render(
      <BurndownPanel
        burndownData={mockBurndownData}
        burndownMeta={mockMeta}
        isDark={true}
      />
    );

    expect(screen.getByText('Execution Burndown')).toBeInTheDocument();
    expect(screen.getByText('100 Cases')).toBeInTheDocument();
    expect(screen.getAllByText('50').length).toBe(2);
    expect(screen.getByText('8 Wks')).toBeInTheDocument();
  });


  test('renders zero state when no data is provided', () => {
    render(<BurndownPanel burndownData={[]} burndownMeta={{}} />);
    expect(screen.getByText(/No timeline data available/i)).toBeInTheDocument();
  });
});
