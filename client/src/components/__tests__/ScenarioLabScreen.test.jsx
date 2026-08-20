import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ScenarioLabScreen from '../ScenarioLabScreen';

describe('ScenarioLabScreen Component', () => {
  test('renders AI Scenario Drafting Lab heading and matrix configuration', () => {
    render(
      <ScenarioLabScreen
        activeProjectId="p1"
        projects={[{ id: 'p1', name: 'Alpha Project' }]}
      />
    );

    expect(screen.getByText(/AI Scenario Drafting Lab/i)).toBeInTheDocument();
    expect(screen.getByText(/Scope Matrix/i)).toBeInTheDocument();
  });
});
