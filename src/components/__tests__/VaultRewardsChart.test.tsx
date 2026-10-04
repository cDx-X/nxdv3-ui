import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock contexts
vi.mock('../../context/ProtocolContext', () => ({
  ProtocolContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useProtocol: vi.fn(),
}));

vi.mock('../../context/WalletContext', () => ({
  WalletContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useWallet: vi.fn(),
}));

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    formatEther: vi.fn((v) => (Number(v) / 1e18).toString()),
    formatUnits: vi.fn((v, decimals) => (Number(v) / Math.pow(10, decimals || 18)).toString()),
  },
}));

// Mock chart.js
vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  CategoryScale: {},
  LinearScale: {},
  BarElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
}));

let capturedChartProps: any = [];

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Bar: (props: any) => {
    capturedChartProps.push(props);
    return React.createElement('div', null, 'BarChart');
  },
}));

// Mock vaultRewards
vi.mock('../../utils/vaultRewards', () => ({
  fetchVaultRewards: vi.fn(),
}));

// Mock RangeSlider
vi.mock('./RangeSlider', () => ({
  RangeSlider: () => React.createElement('div', null, 'RangeSlider'),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  UserCheck: () => React.createElement('span', null, 'UserCheck'),
}));

import { VaultRewardsChart } from '../VaultRewardsChart';
import { useProtocol } from '../../context/ProtocolContext';
import { useWallet } from '../../context/WalletContext';
import { fetchVaultRewards } from '../../utils/vaultRewards';

const mockProtocolContext = {
  globalData: {
    isLoaded: true,
    totalVaultStaked: 1000000000000000000000000n,
    totalETHToStakingVault: 5000000000000000000n,
    totalXENBought: 100000000000000000000000n,
    nxdTotalSupply: 2000000000000000000000000n,
  },
  userData: {
    isLoaded: true,
    stakedBalance: 100000000000000000000000n,
    pendingETH: 100000000000000000n,
    pendingXEN: 5000000000000000000n,
  },
};

const mockWalletContext = {
  isConnected: true,
};

describe('VaultRewardsChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useProtocol as any).mockReturnValue(mockProtocolContext);
    (useWallet as any).mockReturnValue(mockWalletContext);
    (fetchVaultRewards as any).mockResolvedValue([]);
  });

  it('renders vault rewards chart and resolves loading state', async () => {
    render(React.createElement(VaultRewardsChart));

    expect(screen.getByText(/Historical ETH and XEN reward inflows/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/No reward inflows recorded yet/)).toBeInTheDocument();
    });
  });

  it('shows loading state initially while fetch is pending', async () => {
    (fetchVaultRewards as any).mockReturnValue(new Promise(() => {}));
    render(React.createElement(VaultRewardsChart));

    expect(screen.getByText(/Loading rewards history/)).toBeInTheDocument();
  });

  it('renders chart data when rewards are present', async () => {
    (fetchVaultRewards as any).mockResolvedValue([
      { epoch: 1, date: '2025-01-01', ethWei: 1000000000000000000n, xenWei: 2000000000000000000000n },
      { epoch: 2, date: '2025-01-08', ethWei: 2000000000000000000n, xenWei: 3000000000000000000000n },
    ]);

    render(React.createElement(VaultRewardsChart));

    await waitFor(() => {
      expect(screen.getAllByText('BarChart')).toHaveLength(2);
    });
  });

  it('removes epoch dates from the x-axis while keeping them in the tooltip', async () => {
    capturedChartProps = [];
    (fetchVaultRewards as any).mockResolvedValue([
      { epoch: 1, date: '2025-01-01', ethWei: 1000000000000000000n, xenWei: 2000000000000000000000n },
      { epoch: 2, date: '2025-01-08', ethWei: 2000000000000000000n, xenWei: 3000000000000000000000n },
    ]);

    render(React.createElement(VaultRewardsChart));

    await waitFor(() => {
      expect(capturedChartProps.length).toBeGreaterThanOrEqual(2);
    });

    // Use the latest captured props for each chart
    const ethProps = [...capturedChartProps]
      .reverse()
      .find((p) => p.data.datasets[0].label === 'ETH Inflow');
    const xenProps = [...capturedChartProps]
      .reverse()
      .find((p) => p.data.datasets[0].label === 'XEN Inflow');

    // Dates are no longer shown on the x-axis under the bars
    expect(ethProps.data.labels).toEqual(['Ep #1', 'Ep #2']);
    expect(ethProps.data.labels.join(' ')).not.toContain('2025-01-01');
    expect(xenProps.data.labels).toEqual(['Ep #1', 'Ep #2']);

    // The date is still available in the hover tooltip title
    const ethTooltipTitle = ethProps.options.plugins.tooltip.callbacks.title([{ dataIndex: 0 }]);
    expect(ethTooltipTitle).toContain('Ep #1');
    expect(ethTooltipTitle).toContain('2025-01-01');

    const xenTooltipTitle = xenProps.options.plugins.tooltip.callbacks.title([{ dataIndex: 1 }]);
    expect(xenTooltipTitle).toContain('Ep #2');
    expect(xenTooltipTitle).toContain('2025-01-08');
  });

  it('shows error message if fetch fails', async () => {
    (fetchVaultRewards as any).mockRejectedValue(new Error('Network error'));

    render(React.createElement(VaultRewardsChart));

    await waitFor(() => {
      expect(screen.getByText('Failed to load vault rewards history.')).toBeInTheDocument();
    });
  });

  it('shows user share section', async () => {
    render(React.createElement(VaultRewardsChart));

    expect(screen.getByText(/Your share/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/Loading rewards history/)).not.toBeInTheDocument();
    });
  });

  it('shows connect wallet message when not connected', async () => {
    (useWallet as any).mockReturnValue({ isConnected: false });
    render(React.createElement(VaultRewardsChart));

    expect(screen.getByText(/Connect wallet to view/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/Loading rewards history/)).not.toBeInTheDocument();
    });
  });
  it('tests chart options callbacks and tick formatting correctly', async () => {
    capturedChartProps = [];
    (fetchVaultRewards as any).mockResolvedValue([
      { epoch: 1, date: '2025-01-01', ethWei: 1000000000000000000n, xenWei: 2000000000000000000000n },
    ]);

    render(React.createElement(VaultRewardsChart));

    await waitFor(() => {
      expect(capturedChartProps.length).toBeGreaterThanOrEqual(2);
    });

    // Check ETH chart options (first chart)
    const ethChartProps = capturedChartProps[0];
    const ethOptions = ethChartProps.options;
    const ethTooltipLabel = ethOptions.plugins.tooltip.callbacks.label({
      dataset: { label: 'ETH Inflow' },
      parsed: { y: 1.23456789 },
    });
    expect(ethTooltipLabel).toContain('ETH Inflow:');
    expect(ethTooltipLabel).toContain('ETH');

    const ethTickFormatter = ethOptions.scales.y.ticks.callback;
    expect(ethTickFormatter(2500000)).toBe('2.5M');
    expect(ethTickFormatter(3500)).toBe('3.5k');
    expect(ethTickFormatter(0.5)).toBe('0.500');

    // Check XEN chart options (second chart)
    const xenChartProps = capturedChartProps[1];
    const xenOptions = xenChartProps.options;
    const xenTickFormatter = xenOptions.scales.y.ticks.callback;
    expect(xenTickFormatter(2000000000)).toBe('2.0B');
    expect(xenTickFormatter(5000000)).toBe('5.0M');
    expect(xenTickFormatter(1500)).toBe('1.5k');
    expect(xenTickFormatter(42)).toBe('42');
  });
});
