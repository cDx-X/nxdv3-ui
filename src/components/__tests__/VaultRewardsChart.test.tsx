import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock contexts
vi.mock('../../context/ProtocolContext', () => {
  const React = require('react');
  return {
    ProtocolContext: {
      Provider: ({ children }: { children: React.ReactNode }) => children,
    },
    useProtocol: vi.fn(),
  };
});

vi.mock('../../context/WalletContext', () => {
  const React = require('react');
  return {
    WalletContext: {
      Provider: ({ children }: { children: React.ReactNode }) => children,
    },
    useWallet: vi.fn(),
  };
});

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

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Bar: () => React.createElement('div', null, 'BarChart'),
}));

// Mock vaultRewards - return empty array to show loading state
vi.mock('../../utils/vaultRewards', () => ({
  fetchVaultRewards: vi.fn().mockResolvedValue([]),
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

const mockProtocolContext = {
  globalData: {
    isLoaded: true,
    totalVaultStaked: 1000000000000000000000000n,
  },
  userData: {
    isLoaded: true,
    stakedBalance: 100000000000000000000000n,
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
  });

  it('renders vault rewards chart', () => {
    render(React.createElement(VaultRewardsChart));

    expect(screen.getByText(/Historical ETH and XEN reward inflows/)).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(React.createElement(VaultRewardsChart));

    expect(screen.getByText(/Loading rewards history/)).toBeInTheDocument();
  });

  it('shows user share section', () => {
    render(React.createElement(VaultRewardsChart));

    expect(screen.getByText(/Your share/)).toBeInTheDocument();
  });

  it('shows connect wallet message when not connected', () => {
    (useWallet as any).mockReturnValue({ isConnected: false });
    render(React.createElement(VaultRewardsChart));

    expect(screen.getByText(/Connect wallet to view/)).toBeInTheDocument();
  });
});
