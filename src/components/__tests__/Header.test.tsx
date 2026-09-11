import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock contexts
vi.mock('../../context/WalletContext', () => ({
  WalletContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useWallet: vi.fn(),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Wallet: () => React.createElement('span', null, 'Wallet'),
  LogOut: () => React.createElement('span', null, 'LogOut'),
  CheckCircle: () => React.createElement('span', null, 'CheckCircle'),
  Flame: () => React.createElement('span', null, 'Flame'),
  ExternalLink: () => React.createElement('span', null, 'ExternalLink'),
  ChevronDown: () => React.createElement('span', null, 'ChevronDown'),
  BarChart3: () => React.createElement('span', null, 'BarChart3'),
  Globe: () => React.createElement('span', null, 'Globe'),
  Menu: () => React.createElement('span', null, 'Menu'),
  X: () => React.createElement('span', null, 'X'),
  Coins: () => React.createElement('span', null, 'Coins'),
  QrCode: () => React.createElement('span', null, 'QrCode'),
  AlertTriangle: () => React.createElement('span', null, 'AlertTriangle'),
}));

// Mock config
vi.mock('../../config/networks', () => ({
  NETWORKS: {
    10: { name: 'Optimism' },
    369: { name: 'PulseChain' },
  },
}));

import { Header } from '../Header';
import { useWallet } from '../../context/WalletContext';

const mockWalletContext = {
  address: '0x1234567890123456789012345678901234567890',
  isConnected: true,
  isConnecting: false,
  chainId: 10n,
  networkConfig: {
    chainId: 10,
    name: 'Optimism',
    addresses: {
      nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      dxnAddress: '0x90386DA49028ef1eF18F47f0a740cAAB50782576',
    },
  },
  connectWallet: vi.fn(),
  disconnectWallet: vi.fn(),
  switchNetwork: vi.fn(),
};

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useWallet as any).mockReturnValue(mockWalletContext);
  });

  it('renders logo', () => {
    render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    // Logo appears in header
    const logoElements = screen.getAllByText('NXD v3 Hub');
    expect(logoElements.length).toBeGreaterThan(0);
  });

  it('shows connect wallet button when not connected', () => {
    (useWallet as any).mockReturnValue({ ...mockWalletContext, isConnected: false });
    render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    // Look for connect wallet button
    const connectElements = screen.getAllByText(/Connect Wallet/);
    expect(connectElements.length).toBeGreaterThan(0);
  });

  it('shows wallet address when connected', () => {
    render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    // Address is formatted as "0x1234...5678"
    const addressElements = screen.getAllByText(/0x1234/);
    expect(addressElements.length).toBeGreaterThan(0);
  });

  it('shows charts button', () => {
    render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    expect(screen.getByText(/Protocol Charts Hub/)).toBeInTheDocument();
  });

  it('calls onOpenCharts when charts button is clicked', () => {
    const onOpenCharts = vi.fn();
    render(
      React.createElement(Header, {
        onOpenCharts,
        onGoHome: vi.fn(),
      })
    );

    fireEvent.click(screen.getByText(/Protocol Charts Hub/));
    expect(onOpenCharts).toHaveBeenCalled();
  });
});
