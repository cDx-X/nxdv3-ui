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
  Smartphone: () => React.createElement('span', null, 'Smartphone'),
  Copy: () => React.createElement('span', null, 'Copy'),
  Check: () => React.createElement('span', null, 'Check'),
}));

// Mock config
vi.mock('../../config/networks', () => ({
  NETWORKS: {
    10: { name: 'Optimism', chainId: 10 },
    8453: { name: 'Base', chainId: 8453 },
    369: { name: 'PulseChain', chainId: 369 },
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
  error: null,
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

  it('calls onGoHome when logo is clicked', () => {
    const onGoHome = vi.fn();
    render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome,
      })
    );

    const logoBtn = screen.getByRole('button', { name: /Go to home page/i });
    fireEvent.click(logoBtn);
    expect(onGoHome).toHaveBeenCalledTimes(1);
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

  it('calls connectWallet when connect button is clicked', () => {
    const connectWallet = vi.fn();
    (useWallet as any).mockReturnValue({ ...mockWalletContext, isConnected: false, connectWallet });
    render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    const connectBtn = screen.getByTitle('Connect Wallet');
    fireEvent.click(connectBtn);
    expect(connectWallet).toHaveBeenCalledTimes(1);
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

  it('calls disconnectWallet when Disconnect button is clicked', () => {
    const disconnectWallet = vi.fn();
    (useWallet as any).mockReturnValue({ ...mockWalletContext, disconnectWallet });
    render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    const disconnectBtn = screen.getByTitle('Disconnect Wallet');
    fireEvent.click(disconnectBtn);
    expect(disconnectWallet).toHaveBeenCalledTimes(1);
  });

  it('shows charts button and triggers onOpenCharts on click', () => {
    const onOpenCharts = vi.fn();
    render(
      React.createElement(Header, {
        onOpenCharts,
        onGoHome: vi.fn(),
      })
    );

    const chartsBtn = screen.getByText(/^Charts$/);
    expect(chartsBtn).toBeInTheDocument();
    fireEvent.click(chartsBtn);
    expect(onOpenCharts).toHaveBeenCalledTimes(1);
  });

  it('opens network dropdown and allows switching networks', () => {
    const switchNetwork = vi.fn();
    (useWallet as any).mockReturnValue({ ...mockWalletContext, switchNetwork });
    const { container } = render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    // Click network dropdown button in desktop header-actions
    const networkDropdownToggle = container.querySelector(
      '.header-actions .dropdown-container:nth-of-type(3) button'
    ) as HTMLElement;
    expect(networkDropdownToggle).not.toBeNull();
    fireEvent.click(networkDropdownToggle);

    // Floating dropdown menu should be rendered
    const dropdownMenu = container.querySelector('.dropdown-menu');
    expect(dropdownMenu).not.toBeNull();

    // PulseChain (369) should be filtered out from the dropdown options
    const dropdownText = dropdownMenu?.textContent || '';
    expect(dropdownText).toContain('Base');
    expect(dropdownText).toContain('Optimism');
    expect(dropdownText).not.toContain('PulseChain');

    // Click Base button inside dropdown menu
    const dropdownItems = dropdownMenu?.querySelectorAll('button.dropdown-item') || [];
    const baseBtn = Array.from(dropdownItems).find((btn) => btn.textContent?.includes('Base'));
    expect(baseBtn).toBeDefined();
    fireEvent.click(baseBtn!);

    expect(switchNetwork).toHaveBeenCalledWith(8453);
  });

  it('toggles mobile drawer open and closed with hamburger menu button', () => {
    const { container } = render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    const menuToggle = container.querySelector('.header-menu-toggle') as HTMLElement;
    const drawer = container.querySelector('.mobile-nav-drawer') as HTMLElement;
    expect(menuToggle).toBeInTheDocument();
    expect(drawer).not.toHaveClass('open');

    // Open mobile menu
    fireEvent.click(menuToggle);
    expect(drawer).toHaveClass('open');

    // Close using close button inside drawer
    const closeBtn = container.querySelector('.mobile-drawer-header .modal-close-btn') as HTMLElement;
    fireEvent.click(closeBtn);
    expect(drawer).not.toHaveClass('open');
  });

  it('closes mobile drawer when backdrop is clicked', () => {
    const { container } = render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    const menuToggle = container.querySelector('.header-menu-toggle') as HTMLElement;
    const drawer = container.querySelector('.mobile-nav-drawer') as HTMLElement;
    fireEvent.click(menuToggle);
    expect(drawer).toHaveClass('open');

    const backdrop = container.querySelector('.mobile-nav-backdrop') as HTMLElement;
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop);

    expect(drawer).not.toHaveClass('open');
  });

  it('renders wallet error banner when error is present in useWallet', () => {
    (useWallet as any).mockReturnValue({
      ...mockWalletContext,
      error: 'User denied transaction signature',
    });

    render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    const errorAlerts = screen.getAllByRole('alert');
    expect(errorAlerts.length).toBeGreaterThan(0);
    const msgElements = screen.getAllByText('User denied transaction signature');
    expect(msgElements.length).toBeGreaterThan(0);
  });

  it('opens and closes QR Code modal from header button', () => {
    render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    const qrBtn = screen.getByTitle('Scan QR Code to open on phone');
    expect(qrBtn).toBeInTheDocument();
    fireEvent.click(qrBtn);

    expect(screen.getByText('Mobile Connection (QR)')).toBeInTheDocument();

    const closeBtn = screen.getByTitle('Close');
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Mobile Connection (QR)')).not.toBeInTheDocument();
  });

});
