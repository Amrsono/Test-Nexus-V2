import React from 'react';
import { render, screen } from '@testing-library/react';
import ExecutiveHero from '../ExecutiveHero';

describe('ExecutiveHero Component', () => {
  test('renders health status and calculated pass rates', () => {
    const stats = {
      total: 50,
      passed: 45,
      failed: 3,
      blocked: 2,
      pending: 0,
    };

    render(<ExecutiveHero stats={stats} projectName="Core Portal" />);

    expect(screen.getByText(/Executive Overview — Core Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/GATE STATUS: HEALTHY/i)).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // 3 failed + 2 blocked
  });

  test('displays AT RISK status when pass rate drops', () => {
    const stats = {
      total: 50,
      passed: 30, // 60%
      failed: 10,
      blocked: 5,
      pending: 5,
    };

    render(<ExecutiveHero stats={stats} projectName="Payment Flow" />);
    expect(screen.getByText(/GATE STATUS: AT RISK/i)).toBeInTheDocument();
  });
});
