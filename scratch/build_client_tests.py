import os

test_dir = "client/src/components/__tests__"
os.makedirs(test_dir, exist_ok=True)

# 1. AdminDashboard.test.jsx
admin_test = """import React from 'react';
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
"""
with open(os.path.join(test_dir, "AdminDashboard.test.jsx"), "w", encoding="utf-8") as f:
    f.write(admin_test)

# 2. BurndownPanel.test.jsx
burndown_test = """import React from 'react';
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
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('8 Wks')).toBeInTheDocument();
  });

  test('renders zero state when no data is provided', () => {
    render(<BurndownPanel burndownData={[]} burndownMeta={{}} />);
    expect(screen.getByText(/No timeline data available/i)).toBeInTheDocument();
  });
});
"""
with open(os.path.join(test_dir, "BurndownPanel.test.jsx"), "w", encoding="utf-8") as f:
    f.write(burndown_test)

# 3. ExecutiveHero.test.jsx
hero_test = """import React from 'react';
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
"""
with open(os.path.join(test_dir, "ExecutiveHero.test.jsx"), "w", encoding="utf-8") as f:
    f.write(hero_test)

# 4. TeamModal.test.jsx
team_test = """import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamModal from '../TeamModal';

const mockTesters = [
  { id: 't-1', name: 'John Doe', email: 'john@example.com', dailyCapacity: 20 },
  { id: 't-2', name: 'Jane Smith', email: 'jane@example.com', dailyCapacity: 15 }
];

describe('TeamModal Component', () => {
  test('renders testers and capacity form when open', () => {
    const onAdd = jest.fn();
    const onDelete = jest.fn();
    const onClose = jest.fn();

    render(
      <TeamModal
        isOpen={true}
        onClose={onClose}
        testers={mockTesters}
        onAddTester={onAdd}
        onDeleteTester={onDelete}
      />
    );

    expect(screen.getByText('Team Capacity & Testers')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('Tester Name');
    fireEvent.change(nameInput, { target: { value: 'New Tester' } });

    const submitBtn = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(submitBtn);

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Tester' }));
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(<TeamModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });
});
"""
with open(os.path.join(test_dir, "TeamModal.test.jsx"), "w", encoding="utf-8") as f:
    f.write(team_test)

# 5. AIInsightsPanel.test.jsx
insights_test = """import React from 'react';
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
"""
with open(os.path.join(test_dir, "AIInsightsPanel.test.jsx"), "w", encoding="utf-8") as f:
    f.write(insights_test)

print('Client test suites created successfully!')
