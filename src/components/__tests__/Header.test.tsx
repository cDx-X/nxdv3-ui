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
  it('closes open dropdown menu when Escape key is pressed', () => {
    const { container } = render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    const networkDropdownToggle = container.querySelector(
      '.header-actions .dropdown-container:nth-of-type(3) button'
    ) as HTMLElement;
    fireEvent.click(networkDropdownToggle);

    expect(container.querySelector('.dropdown-menu')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(container.querySelector('.dropdown-menu')).not.toBeInTheDocument();
  });

  it('closes mobile drawer on window resize above 900px', () => {
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

    // Simulate window resizing to desktop
    window.innerWidth = 1024;
    fireEvent(window, new Event('resize'));

    expect(drawer).not.toHaveClass('open');
  });

  it('toggles Get NXDv3 dropdown and renders links', () => {
    const { container } = render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    const nxdToggle = container.querySelector(
      '.header-actions .dropdown-container:nth-of-type(1) button'
    ) as HTMLElement;
    expect(nxdToggle).toBeInTheDocument();
    fireEvent.click(nxdToggle);

    const dropdownMenu = container.querySelector('.dropdown-menu');
    expect(dropdownMenu).toBeInTheDocument();
    const dropdownItems = dropdownMenu?.querySelectorAll('a.dropdown-item') || [];
    expect(dropdownItems.length).toBe(2);
    expect(dropdownItems[0].textContent).toContain('Uniswap');
    expect(dropdownItems[1].textContent).toContain('Dexscreener');

    fireEvent.click(dropdownItems[0]);
    expect(container.querySelector('.dropdown-menu')).not.toBeInTheDocument();
  });

  it('toggles Get DXNv2 dropdown and renders links', () => {
    const { container } = render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    const dxnToggle = container.querySelector(
      '.header-actions .dropdown-container:nth-of-type(2) button'
    ) as HTMLElement;
    expect(dxnToggle).toBeInTheDocument();
    fireEvent.click(dxnToggle);

    const dropdownMenu = container.querySelector('.dropdown-menu');
    expect(dropdownMenu).toBeInTheDocument();
    const dropdownItems = dropdownMenu?.querySelectorAll('a.dropdown-item') || [];
    expect(dropdownItems.length).toBe(3);
    expect(dropdownItems[0].textContent).toContain('Uniswap');
    expect(dropdownItems[1].textContent).toContain('dbXen v2 vercel');
    expect(dropdownItems[2].textContent).toContain('dbXen v2 app');

    fireEvent.click(dropdownItems[2]);
    expect(container.querySelector('.dropdown-menu')).not.toBeInTheDocument();
  });

  it('handles mobile drawer actions: navigation, network switch, and disconnect', () => {
    const onOpenCharts = vi.fn();
    const switchNetwork = vi.fn();
    const disconnectWallet = vi.fn();

    (useWallet as any).mockReturnValue({
      ...mockWalletContext,
      switchNetwork,
      disconnectWallet,
    });

    const { container } = render(
      React.createElement(Header, {
        onOpenCharts,
        onGoHome: vi.fn(),
      })
    );

    const menuToggle = container.querySelector('.header-menu-toggle') as HTMLElement;
    fireEvent.click(menuToggle);

    // Click Charts Hub inside drawer
    const chartsBtn = screen.getByText('Protocol Charts Hub');
    fireEvent.click(chartsBtn);
    expect(onOpenCharts).toHaveBeenCalledTimes(1);

    // Re-open and switch network via mobile drawer
    fireEvent.click(menuToggle);
    const baseMobileBtns = screen.getAllByText('Base');
    fireEvent.click(baseMobileBtns[baseMobileBtns.length - 1]);
    expect(switchNetwork).toHaveBeenCalledWith(8453);

    // Re-open and click disconnect in drawer
    fireEvent.click(menuToggle);
    const disconnectMobileBtns = screen.getAllByText('Disconnect Wallet');
    fireEvent.click(disconnectMobileBtns[disconnectMobileBtns.length - 1]);
    expect(disconnectWallet).toHaveBeenCalledTimes(1);
  });

  it('handles mobile drawer connect button when disconnected', () => {
    const connectWallet = vi.fn();
    (useWallet as any).mockReturnValue({
      ...mockWalletContext,
      isConnected: false,
      connectWallet,
    });

    const { container } = render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    const menuToggle = container.querySelector('.header-menu-toggle') as HTMLElement;
    fireEvent.click(menuToggle);

    const connectMobileBtn = container.querySelector('.mobile-drawer-content .btn-connect') as HTMLElement;
    expect(connectMobileBtn).toBeInTheDocument();
    fireEvent.click(connectMobileBtn);
    expect(connectWallet).toHaveBeenCalledTimes(1);
  });

  it('handles mobile drawer navigation to QR modal and home page', () => {
    const onGoHome = vi.fn();
    const { container } = render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome,
      })
    );

    const menuToggle = container.querySelector('.header-menu-toggle') as HTMLElement;
    fireEvent.click(menuToggle);

    // Click QR modal option
    const qrBtn = screen.getByText('Mobile QR Code (Connect)');
    fireEvent.click(qrBtn);
    expect(screen.getByText('Mobile Connection (QR)')).toBeInTheDocument();

    // Close QR modal
    fireEvent.click(screen.getByTitle('Close'));

    // Open drawer again and click home logo inside drawer
    fireEvent.click(menuToggle);
    const drawerLogoBtn = container.querySelector('.mobile-drawer-header button[aria-label="Go to home page"]') as HTMLElement;
    fireEvent.click(drawerLogoBtn);
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });

  it('handles mobile drawer links for NXDv3 and DXNv2', () => {
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

    // Click Dexscreener link inside drawer
    const dexLink = screen.getByRole('link', { name: /Dexscreener/i });
    fireEvent.click(dexLink);
    expect(drawer).not.toHaveClass('open');
  });

  it('closes mobile drawer when DXNv2 links (Uniswap, dbXen) are clicked', () => {
    const { container } = render(
      React.createElement(Header, {
        onOpenCharts: vi.fn(),
        onGoHome: vi.fn(),
      })
    );

    const menuToggle = container.querySelector('.header-menu-toggle') as HTMLElement;
    const drawer = container.querySelector('.mobile-nav-drawer') as HTMLElement;

    // Test clicking dbXen v2 Vercel
    fireEvent.click(menuToggle);
    expect(drawer).toHaveClass('open');
    const vercelLink = screen.getByRole('link', { name: /dbXen v2 Vercel/i });
    fireEvent.click(vercelLink);
    expect(drawer).not.toHaveClass('open');

    // Test clicking dbXen v2 App
    fireEvent.click(menuToggle);
    expect(drawer).toHaveClass('open');
    const appLink = screen.getByRole('link', { name: /dbXen v2 App/i });
    fireEvent.click(appLink);
    expect(drawer).not.toHaveClass('open');
  });


});
