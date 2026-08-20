import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminDashboard from '../AdminDashboard';
import api from '../../services/api';

jest.mock('../../services/api');
jest.mock('../../hooks/useToast', () => () => ({
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
}));

const mockUsers = [
  { id: 'u-1', name: 'Alice Tester', email: 'alice@example.com', role: 'ADMIN', subscriptionStatus: 'ACTIVE' },
  { id: 'u-2', name: 'Bob QA', email: 'bob@example.com', role: 'USER', subscriptionStatus: 'TRIAL', trialEndsAt: '2026-12-31' }
];

const mockRequests = [
  { id: 'req-1', userId: 'u-2', method: 'PAYPAL', status: 'PENDING', reference: 'PP-1234' }
];

const mockProjects = [
  { id: 'p-1', name: 'Alpha Suite', themeColor: '#6366f1', createdAt: '2026-01-01' }
];

const mockSettings = [
  { key: 'SUBSCRIPTION_COST', value: '100' },
  { key: 'PAYPAL_EMAIL', value: 'billing@nexus.com' }
];

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.includes('/users/all')) return Promise.resolve({ data: mockUsers });
      if (url.includes('/subscriptions/all')) return Promise.resolve({ data: mockRequests });
      if (url.includes('/projects')) return Promise.resolve({ data: mockProjects });
      if (url.includes('/settings')) return Promise.resolve({ data: mockSettings });
      return Promise.resolve({ data: [] });
    });
  });

  test('renders header and initial Overview tab', async () => {
    render(<AdminDashboard />);
    expect(screen.getByText(/Admin Command Center/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Global Projects Overview/i)).toBeInTheDocument();
      expect(screen.getByText('Alpha Suite')).toBeInTheDocument();
    });
  });

  test('switches tabs to Users and renders user rows', async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(screen.getByText('Alpha Suite')).toBeInTheDocument());

    const usersTabBtn = screen.getByRole('button', { name: /Users/i });
    fireEvent.click(usersTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Alice Tester')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });
  });

  test('switches to Settings tab and displays payment fee', async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(screen.getByText('Alpha Suite')).toBeInTheDocument());

    const settingsTabBtn = screen.getByRole('button', { name: /Settings/i });
    fireEvent.click(settingsTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Platform Configuration/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    });
  });
});
