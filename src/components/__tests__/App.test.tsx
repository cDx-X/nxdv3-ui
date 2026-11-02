import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('../../context/WalletContext', () => ({
  WalletProvider: ({ children }: { children: React.ReactNode }) => children,
  useWallet: vi.fn(),
}));

vi.mock('../../context/ProtocolContext', () => ({
  ProtocolProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../Header', () => ({
  Header: ({ onOpenCharts, onGoHome }: any) => (
    <div data-testid="header">
      <button onClick={onOpenCharts}>Open Charts</button>
      <button onClick={onGoHome}>Go Home</button>
    </div>
  ),
}));

vi.mock('../Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

vi.mock('../ProtocolStatsWindow', () => ({
  ProtocolStatsWindow: () => <div data-testid="stats-window">Stats</div>,
}));

vi.mock('../ProtocolDeposit', () => ({
  ProtocolDeposit: () => <div data-testid="protocol-deposit">Deposit</div>,
}));

vi.mock('../VaultStaking', () => ({
  VaultStaking: () => <div data-testid="vault-staking">Staking</div>,
}));

vi.mock('../ProtocolInfoCard', () => ({
  ProtocolInfoCard: () => <div data-testid="protocol-info-card">Info</div>,
}));

vi.mock('../EpochChartsPage', () => ({
  EpochChartsPage: ({ onBack }: any) => (
    <div data-testid="epoch-charts-page">
      <button onClick={onBack}>Back to Dashboard</button>
    </div>
  ),
}));

import { useWallet } from '../../context/WalletContext';
import App from '../../App';

describe('App', () => {
  const mockWalletContext = {
    networkConfig: {
      chainId: 10,
      name: 'Optimism',
      addresses: {
        protocolAddress: '0x8C6f6ec2281D5678844556887DEDa5cEC907De87',
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
        dxnAddress: '0x90386DA49028ef1eF18F47f0a740cAAB50782576',
        taxRecipientAddress: '0x8ae6A0Ab65cE133365760F11367d5353BBcf5f40',
        XenAddress: '0xeB585163DEbB1E637c6D617de3bEF99347cd75c8',
      },
    },
    networkWarning: null,
    switchNetwork: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useWallet as any).mockReturnValue(mockWalletContext);
  });

  it('renders dashboard view by default', () => {
    render(React.createElement(App));
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('stats-window')).toBeInTheDocument();
    expect(screen.getByTestId('protocol-deposit')).toBeInTheDocument();
    expect(screen.getByTestId('vault-staking')).toBeInTheDocument();
    expect(screen.getByTestId('protocol-info-card')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    // Charts page should NOT be rendered
    expect(screen.queryByTestId('epoch-charts-page')).toBeNull();
  });

  it('renders app title', () => {
    render(React.createElement(App));
    expect(screen.getByText('NXDv3 Protocol & Staking Hub')).toBeInTheDocument();
    expect(screen.getByText('Deflationary DXNv2 Derivative')).toBeInTheDocument();
    expect(
      screen.getByText(/Mint and stake NXDv3 tokens on the Optimism network/i)
    ).toBeInTheDocument();
  });

  it('switches to charts view when Open Charts button is clicked', async () => {
    render(React.createElement(App));
    fireEvent.click(screen.getByText('Open Charts'));
    expect(await screen.findByTestId('epoch-charts-page')).toBeInTheDocument();
  });

  it('returns to dashboard view when Back to Dashboard is clicked', async () => {
    render(React.createElement(App));
    fireEvent.click(screen.getByText('Open Charts'));
    expect(await screen.findByTestId('epoch-charts-page')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Back to Dashboard'));
    expect(screen.queryByTestId('epoch-charts-page')).toBeNull();
    expect(screen.getByTestId('stats-window')).toBeInTheDocument();
  });

  it('shows network warning when provided', () => {
    (useWallet as any).mockReturnValue({
      ...mockWalletContext,
      networkWarning: 'Wrong network',
    });
    render(React.createElement(App));
    expect(screen.getByText('Wrong network')).toBeInTheDocument();
    expect(screen.getByText('Switch to Optimism')).toBeInTheDocument();
  });

  it('calls switchNetwork with chainId 10 when Switch to Optimism clicked', () => {
    const mockSwitch = vi.fn();
    (useWallet as any).mockReturnValue({
      ...mockWalletContext,
      networkWarning: 'Wrong network',
      switchNetwork: mockSwitch,
    });
    render(React.createElement(App));
    fireEvent.click(screen.getByText('Switch to Optimism'));
    expect(mockSwitch).toHaveBeenCalledWith(10);
  });
});
