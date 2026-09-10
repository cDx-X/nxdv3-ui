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

// Mock chart.js
vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  ArcElement: {},
  Tooltip: {},
  Legend: {},
}));

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Doughnut: () => React.createElement('div', null, 'DoughnutChart'),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  RefreshCw: () => React.createElement('span', null, 'Refresh'),
  Layers: () => React.createElement('span', null, 'Layers'),
  Flame: () => React.createElement('span', null, 'Flame'),
  Shield: () => React.createElement('span', null, 'Shield'),
  Clock: () => React.createElement('span', null, 'Clock'),
}));

import { SupplyBarChart } from '../SupplyBarChart';
import { useProtocol } from '../../context/ProtocolContext';

const mockProtocolContext = {
  globalData: {
    isLoaded: true,
    nxdTotalSupply: 1000000000000000000000000n,
    totalNXDBurned: 100000000000000000000000n,
    totalVaultStaked: 300000000000000000000000n,
    nxdMaxSupply: 2000000000000000000000000n,
  },
  isLoadingGlobal: false,
};

describe('SupplyBarChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useProtocol as any).mockReturnValue(mockProtocolContext);
  });

  it('renders supply chart', () => {
    render(React.createElement(SupplyBarChart, {}));

    expect(screen.getByText(/Supply Structure/)).toBeInTheDocument();
  });

  it('shows total supply', () => {
    render(React.createElement(SupplyBarChart, {}));

    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('shows staked amount', () => {
    render(React.createElement(SupplyBarChart, {}));

    // Use getAllByText since "Staked" appears in multiple places
    const stakedElements = screen.getAllByText('Staked');
    expect(stakedElements.length).toBeGreaterThan(0);
  });

  it('shows liquid amount', () => {
    render(React.createElement(SupplyBarChart, {}));

    // Use more specific selector
    const liquidElements = screen.getAllByText(/Liquid/);
    expect(liquidElements.length).toBeGreaterThan(0);
  });

  it('shows burned amount', () => {
    render(React.createElement(SupplyBarChart, {}));

    // Use more specific selector
    const burnedElements = screen.getAllByText(/Burned/);
    expect(burnedElements.length).toBeGreaterThan(0);
  });

  it('shows doughnut chart', () => {
    render(React.createElement(SupplyBarChart, {}));

    expect(screen.getByText('DoughnutChart')).toBeInTheDocument();
  });
});
