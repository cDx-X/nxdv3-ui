import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock contexts before importing components
vi.mock('../../context/ProtocolContext', () => ({
  ProtocolContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useProtocol: vi.fn(() => ({
    globalData: {
      isLoaded: true,
      effectiveSupply: 1000000000000000000000000n,
      totalMinted: 500000000000000000000000n,
      totalNXDBurned: 100000000000000000000000n,
      totalDXNBurned: 50000000000000000000000n,
      totalDXNStaked: 200000000000000000000000n,
      totalVaultStaked: 300000000000000000000000n,
      totalETHSentToVault: 10000000000000000000n,
      totalXENSentToVault: 50000000000000000000n,
      nxdMaxSupply: 2000000000000000000000000n,
      burnedPercentage: 5.0,
      nxdTotalSupply: 1000000000000000000000000n,
      maxMintableDeposit: 1000000000000000000000000n,
      nxdMintedViaDeposit: 50000000000000000000000n,
      currentRate: 1000000000000000000n,
      tierSize: 1000000000000000000000n,
    },
    userData: {
      isLoaded: true,
      stakedBalance: 100000000000000000000000n,
    },
    refreshAll: vi.fn(),
    isLoadingGlobal: false,
  })),
}));

vi.mock('../../context/WalletContext', () => ({
  WalletContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useWallet: vi.fn(() => ({
    isConnected: true,
  })),
}));

// Mock ethers
vi.mock('ethers', () => {
  const Interface = vi.fn().mockImplementation(function () {
    return {
      encodeFunctionData: vi.fn().mockReturnValue('0x'),
      decodeFunctionResult: vi.fn().mockReturnValue([100n]),
    };
  });

  return {
    ethers: {
      formatEther: vi.fn((v) => (Number(v) / 1e18).toString()),
      formatUnits: vi.fn((v, decimals) => (Number(v) / Math.pow(10, decimals || 18)).toString()),
      isAddress: vi.fn(() => true),
      Interface: Interface,
    },
  };
});

// Mock chart.js
vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  CategoryScale: {},
  LinearScale: {},
  BarElement: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {},
  ArcElement: {},
}));

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Bar: () => React.createElement('div', null, 'BarChart'),
  Line: () => React.createElement('div', null, 'LineChart'),
  Doughnut: () => React.createElement('div', null, 'DoughnutChart'),
}));

// Mock lucide-react with all needed icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => React.createElement('span', null, 'ArrowLeft'),
  BarChart3: () => React.createElement('span', null, 'BarChart3'),
  Flame: () => React.createElement('span', null, 'Flame'),
  Layers: () => React.createElement('span', null, 'Layers'),
  Coins: () => React.createElement('span', null, 'Coins'),
  Info: () => React.createElement('span', null, 'Info'),
  ChevronDown: () => React.createElement('span', null, 'ChevronDown'),
  ChevronUp: () => React.createElement('span', null, 'ChevronUp'),
  Clock: () => React.createElement('span', null, 'Clock'),
  Shield: () => React.createElement('span', null, 'Shield'),
  Activity: () => React.createElement('span', null, 'Activity'),
  ShieldCheck: () => React.createElement('span', null, 'ShieldCheck'),
  PieChart: () => React.createElement('span', null, 'PieChart'),
  Sparkles: () => React.createElement('span', null, 'Sparkles'),
  ShieldAlert: () => React.createElement('span', null, 'ShieldAlert'),
  Lock: () => React.createElement('span', null, 'Lock'),
  UserCheck: () => React.createElement('span', null, 'UserCheck'),
  RefreshCw: () => React.createElement('span', null, 'Refresh'),
}));

// Mock child components with simple implementations
vi.mock('../EpochBurnChart', () => ({
  EpochBurnChart: () =>
    React.createElement('div', { 'data-testid': 'epoch-burn-chart' }, 'EpochBurnChart'),
}));
vi.mock('../SupplyBarChart', () => ({
  SupplyBarChart: () =>
    React.createElement('div', { 'data-testid': 'supply-bar-chart' }, 'SupplyBarChart'),
}));
vi.mock('../MintingTierChart', () => ({
  MintingTierChart: () =>
    React.createElement('div', { 'data-testid': 'minting-tier-chart' }, 'MintingTierChart'),
}));
vi.mock('../VaultRewardsChart', () => ({
  VaultRewardsChart: () =>
    React.createElement('div', { 'data-testid': 'vault-rewards-chart' }, 'VaultRewardsChart'),
}));

import { EpochChartsPage } from '../EpochChartsPage';

describe('EpochChartsPage', () => {
  const defaultProps = {
    onBack: vi.fn(),
    nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
    XenAddress: '0xeB585163DEbB1E637c6D617de3bEF99347cd75c8',
    dxnAddress: '0x90386DA49028ef1eF18F47f0a740cAAB50782576',
    protocolAddress: '0x8C6f6ec2281D5678844556887DEDa5cEC907De87',
    taxRecipientAddress: '0x8ae6A0Ab65cE133365760F11367d5353BBcf5f40',
  };

  it('renders page title', () => {
    render(React.createElement(EpochChartsPage, defaultProps));
    expect(screen.getByText(/Economic Charts Hub/)).toBeInTheDocument();
  });

  it('shows back button', () => {
    render(React.createElement(EpochChartsPage, defaultProps));
    expect(screen.getByText(/Back to Dashboard/)).toBeInTheDocument();
  });

  it('shows epoch burn chart section', () => {
    render(React.createElement(EpochChartsPage, defaultProps));
    // The section title is rendered by EpochChartsPage, not the child component
    expect(screen.getByText(/Epoch Burn/)).toBeInTheDocument();
  });

  it('shows supply bar chart section', () => {
    render(React.createElement(EpochChartsPage, defaultProps));
    expect(screen.getByText(/Supply & Distribution/)).toBeInTheDocument();
  });

  it('shows minting tier chart section', () => {
    render(React.createElement(EpochChartsPage, defaultProps));
    expect(screen.getByText(/Minting Tier/)).toBeInTheDocument();
  });

  it('shows vault rewards chart section', () => {
    render(React.createElement(EpochChartsPage, defaultProps));
    expect(screen.getByText(/Vault Rewards/)).toBeInTheDocument();
  });
  it('toggles descriptions for each chart section when clicking Info buttons', () => {
    render(React.createElement(EpochChartsPage, defaultProps));

    // Get all toggle buttons
    const infoButtons = screen.getAllByTitle('Toggle Chart Description');
    expect(infoButtons).toHaveLength(4);

    // Initial state: no descriptions rendered
    expect(screen.queryByText(/Deflationary pressure/i)).not.toBeInTheDocument();

    // Toggle 1: Supply Info (now index 0)
    fireEvent.click(infoButtons[0]);
    expect(screen.getByText(/Breakdown of the total emitted NXDv3 supply/i)).toBeInTheDocument();
    fireEvent.click(infoButtons[0]);
    expect(
      screen.queryByText(/Breakdown of the total emitted NXDv3 supply/i)
    ).not.toBeInTheDocument();

    // Toggle 2: Epoch Burn Info (now index 1)
    fireEvent.click(infoButtons[1]);
    expect(screen.getByText(/Amount of burned NXDv3 broken down by cycles/i)).toBeInTheDocument();
    fireEvent.click(infoButtons[1]);
    expect(
      screen.queryByText(/Amount of burned NXDv3 broken down by cycles/i)
    ).not.toBeInTheDocument();

    // Toggle 3: Vault Info (now index 2)
    fireEvent.click(infoButtons[2]);
    expect(
      screen.getByText(
        /Growth in total value of ETH and XEN rewards transferred to the Staking Vault/i
      )
    ).toBeInTheDocument();
    fireEvent.click(infoButtons[2]);
    expect(
      screen.queryByText(
        /Growth in total value of ETH and XEN rewards transferred to the Staking Vault/i
      )
    ).not.toBeInTheDocument();

    // Toggle 4: Mint Info (now index 3)
    fireEvent.click(infoButtons[3]);
    expect(screen.getByText(/Current DXNv2\/NXDv3 exchange rate/i)).toBeInTheDocument();
    fireEvent.click(infoButtons[3]);
    expect(screen.queryByText(/Current DXNv2\/NXDv3 exchange rate/i)).not.toBeInTheDocument();
  });

  it('triggers onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(React.createElement(EpochChartsPage, { ...defaultProps, onBack }));

    const backBtn = screen.getByText(/Back to Dashboard/);
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
