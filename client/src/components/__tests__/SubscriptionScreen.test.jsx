import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import SubscriptionScreen from '../SubscriptionScreen';

jest.mock('axios');
jest.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      const translations = {
        paymentProofSubmitted: 'Payment Submitted',
        paymentProofDesc: 'We will review your submission.',
        backToDashboard: 'Back to Dashboard',
        refreshStatus: 'Refresh Status',
        premiumSubscription: 'Premium Subscription',
        active: 'Active',
        allFeaturesUnlocked: 'All Features Unlocked',
        premiumFeaturesDesc: 'You have full access to all features.',
        renewsExpires: 'Expires',
        daysRemaining: `${opts?.count ?? 0} days remaining`,
        trialActive: `Trial active until ${opts?.date}`,
        trialExpired: 'Trial Expired',
        importExportRestricted: 'Import and export are restricted.',
        trialEndedDesc: 'Your trial has ended.',
        upgradeToPremium: 'Upgrade to Premium',
        unlockFullAutomation: 'Unlock full automation.',
        monthly: '/month',
        choosePaymentMethod: 'Choose Payment Method',
        paymentHistory: 'Payment History',
        noPaymentRequests: 'No payment requests yet.',
        manualVerificationNote: 'Manual verification required.',
        processing: 'Processing...',
        submitPaymentProof: 'Submit Payment Proof',
        aiScenarioLab: 'AI Scenario Lab',
        bulkImports: 'Bulk Imports',
        execPdfReports: 'PDF Reports',
        multiProjectAnalytics: 'Analytics',
        teamManagement: 'Team Management',
        fullAiGeneration: 'Full AI Generation',
      };
      return translations[key] ?? key;
    }
  })
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  subscriptionStatus: 'TRIAL',
  trialEndsAt: '2026-12-31T00:00:00.000Z',
  subscriptionExpiresAt: null,
};

describe('SubscriptionScreen', () => {
  const onBack = jest.fn();
  const onStatusUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: [] });
  });

  test('renders the Back button', async () => {
    render(<SubscriptionScreen user={mockUser} onBack={onBack} onStatusUpdate={onStatusUpdate} />);
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  test('calls onBack when back button is clicked', async () => {
    render(<SubscriptionScreen user={mockUser} onBack={onBack} onStatusUpdate={onStatusUpdate} />);
    fireEvent.click(screen.getByText('Back to Dashboard'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test('shows trial status banner for trial users', async () => {
    render(<SubscriptionScreen user={mockUser} onBack={onBack} onStatusUpdate={onStatusUpdate} />);
    await waitFor(() => {
      expect(screen.getByText(/trial active until/i)).toBeInTheDocument();
    });
  });

  test('shows premium banner for active subscribers', async () => {
    const premiumUser = { ...mockUser, subscriptionStatus: 'ACTIVE', subscriptionExpiresAt: '2027-01-01T00:00:00.000Z' };
    render(<SubscriptionScreen user={premiumUser} onBack={onBack} onStatusUpdate={onStatusUpdate} />);
    await waitFor(() => {
      expect(screen.getByText('All Features Unlocked')).toBeInTheDocument();
    });
  });

  test('renders payment methods when user is not premium', async () => {
    render(<SubscriptionScreen user={mockUser} onBack={onBack} onStatusUpdate={onStatusUpdate} />);
    await waitFor(() => {
      expect(screen.getByText('Vodafone')).toBeInTheDocument();
      expect(screen.getByText('PayPal')).toBeInTheDocument();
      expect(screen.getByText('Payoneer')).toBeInTheDocument();
    });
  });

  test('shows success banner after payment form submission', async () => {
    axios.get.mockResolvedValue({ data: [] });
    axios.post.mockResolvedValue({ data: { id: 'sub-1' } });

    render(<SubscriptionScreen user={mockUser} onBack={onBack} onStatusUpdate={onStatusUpdate} />);

    // Select Vodafone payment
    await waitFor(() => screen.getByText('Vodafone'));
    fireEvent.click(screen.getByText('Vodafone'));

    // Fill in transaction ID
    const input = screen.getByPlaceholderText('Paste transaction ID here...');
    fireEvent.change(input, { target: { value: 'TXN-12345' } });

    // Submit
    fireEvent.click(screen.getByText('Submit Payment Proof'));

    await waitFor(() => {
      expect(screen.getByText('Payment Submitted')).toBeInTheDocument();
    });
  });
});
