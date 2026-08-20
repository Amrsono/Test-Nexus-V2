import React from 'react';
import { render, screen } from '@testing-library/react';
import AIInsightsPanel from '../AIInsightsPanel';

const mockInsights = [
  { id: 'ins-1', title: 'Schedule Slippage Alert', message: 'Current velocity is 85% of target.', severity: 'HIGH' },
  { id: 'ins-2', title: 'High Blocker Density', message: 'Module Payment has 4 blockers.', severity: 'MEDIUM', action: 'Reassign Tester A' }
];

describe('AIInsightsPanel Component', () => {
  test('renders AI insights feed with severity alerts', () => {
    render(<AIInsightsPanel insights={mockInsights} isDark={true} />);

    expect(screen.getByText(/AI Quality Advisor/i)).toBeInTheDocument();
    expect(screen.getByText('Schedule Slippage Alert')).toBeInTheDocument();
    expect(screen.getByText('High Blocker Density')).toBeInTheDocument();
    expect(screen.getByText(/Suggested Action: Reassign Tester A/i)).toBeInTheDocument();
  });

  test('shows zero state when no insights exist', () => {
    render(<AIInsightsPanel insights={[]} />);
    expect(screen.getByText(/No active risk alerts/i)).toBeInTheDocument();
  });
});
