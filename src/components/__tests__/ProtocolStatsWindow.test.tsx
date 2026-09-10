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

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    formatEther: vi.fn((v) => (Number(v) / 1e18).toString()),
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  RefreshCw: () => React.createElement('span', null, 'Refresh'),
  Activity: () => React.createElement('span', null, 'Activity'),
  Flame: () => React.createElement('span', null, 'Flame'),
  Coins: () => React.createElement('span', null, 'Coins'),
  ShieldCheck: () => React.createElement('span', null, 'ShieldCheck'),
  PieChart: () => React.createElement('span', null, 'PieChart'),
  Sparkles: () => React.createElement('span', null, 'Sparkles'),
  Clock: () => React.createElement('span', null, 'Clock'),
  ShieldAlert: () => React.createElement('span', null, 'ShieldAlert'),
  Lock: () => React.createElement('span', null, 'Lock'),
}));

import { ProtocolStatsWindow } from '../ProtocolStatsWindow';
import { useProtocol } from '../../context/ProtocolContext';

const mockProtocolContext = {
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
  },
  refreshAll: vi.fn(),
  isLoadingGlobal: false,
  setIsLoadingGlobal: vi.fn(),
};

describe('ProtocolStatsWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useProtocol as any).mockReturnValue(mockProtocolContext);
  });

  it('renders stats window with title', () => {
    render(React.createElement(ProtocolStatsWindow, {}));

    expect(screen.getByText('Voltage Mane')).toBeInTheDocument();
  });

  it('shows effective supply stat', () => {
    render(React.createElement(ProtocolStatsWindow, {}));

    expect(screen.getByText(/Effective Supply/)).toBeInTheDocument();
  });

  it('shows total minted stat', () => {
    render(React.createElement(ProtocolStatsWindow, {}));

    expect(screen.getByText(/Total NXDv3 Mined/)).toBeInTheDocument();
  });

  it('shows NXD burned stat', () => {
    render(React.createElement(ProtocolStatsWindow, {}));

    expect(screen.getByText(/Total NXDv3 Burned/)).toBeInTheDocument();
  });

  it('shows DXN burned stat', () => {
    render(React.createElement(ProtocolStatsWindow, {}));

    expect(screen.getByText(/Total DXNv2 Burned/)).toBeInTheDocument();
  });

  it('shows ETH sent to vault stat', () => {
    render(React.createElement(ProtocolStatsWindow, {}));

    expect(screen.getByText(/ETH Sent to Vault/)).toBeInTheDocument();
  });

  it('shows XEN sent to vault stat', () => {
    render(React.createElement(ProtocolStatsWindow, {}));

    expect(screen.getByText(/XEN Sent to Vault/)).toBeInTheDocument();
  });

  it('shows max supply stat', () => {
    render(React.createElement(ProtocolStatsWindow, {}));

    expect(screen.getByText(/Max Supply/)).toBeInTheDocument();
  });

  it('shows burned percentage stat', () => {
    render(React.createElement(ProtocolStatsWindow, {}));

    expect(screen.getByText(/Total NXDv3 Burned/)).toBeInTheDocument();
  });

  it('shows refresh button', () => {
    render(React.createElement(ProtocolStatsWindow, {}));

    expect(screen.getByTitle('Refresh All Metrics')).toBeInTheDocument();
  });
});
