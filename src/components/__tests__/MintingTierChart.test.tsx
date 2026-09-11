import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock contexts
vi.mock('../../context/ProtocolContext', () => ({
  ProtocolContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useProtocol: vi.fn(),
}));

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    formatEther: vi.fn((v) => (Number(v) / 1e18).toString()),
  },
}));

// Mock chart.js
vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  BarElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {},
}));

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Line: () => React.createElement('div', null, 'LineChart'),
}));

import { MintingTierChart } from '../MintingTierChart';
import { useProtocol } from '../../context/ProtocolContext';

const mockProtocolContext = {
  globalData: {
    isLoaded: true,
    maxMintableDeposit: 1000000000000000000000000n,
    nxdMintedViaDeposit: 50000000000000000000000n,
  },
};

describe('MintingTierChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useProtocol as any).mockReturnValue(mockProtocolContext);
  });

  it('renders minting tier chart', () => {
    render(React.createElement(MintingTierChart));

    expect(screen.getByText(/DXNv2 to NXDv3 minting rate/)).toBeInTheDocument();
  });

  it('shows current tier info', () => {
    render(React.createElement(MintingTierChart));

    expect(screen.getByText(/Current Tier/)).toBeInTheDocument();
  });

  it('shows mint rate', () => {
    render(React.createElement(MintingTierChart));

    expect(screen.getByText(/Mint Rate/)).toBeInTheDocument();
  });

  it('shows tier progress', () => {
    render(React.createElement(MintingTierChart));

    expect(screen.getByText(/Tier Progress/)).toBeInTheDocument();
  });

  it('shows line chart', () => {
    render(React.createElement(MintingTierChart));

    expect(screen.getByText('LineChart')).toBeInTheDocument();
  });
});
