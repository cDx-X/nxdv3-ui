import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    isAddress: vi.fn(() => true),
    formatEther: vi.fn((v) => (Number(v) / 1e18).toString()),
  },
}));

// Mock multicall
vi.mock('../../utils/multicall', () => ({
  multicall: vi.fn(),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  BarChart: () => React.createElement('span', null, 'BarChart'),
}));

import { EpochBurnChart } from '../EpochBurnChart';
import { multicall } from '../../utils/multicall';

describe('EpochBurnChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders chart with title', () => {
    render(React.createElement(EpochBurnChart, {
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    expect(screen.getByText(/NXDv3 Burn Volume/)).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(React.createElement(EpochBurnChart, {
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    expect(screen.getByText(/Loading epoch data/)).toBeInTheDocument();
  });

  it('shows first burn date label', () => {
    render(React.createElement(EpochBurnChart, {
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    expect(screen.getByText(/First Burn/)).toBeInTheDocument();
  });

  it('shows current epoch label', () => {
    render(React.createElement(EpochBurnChart, {
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    expect(screen.getByText(/Active Epoch/)).toBeInTheDocument();
  });

  it('shows total burned label', () => {
    render(React.createElement(EpochBurnChart, {
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    expect(screen.getByText(/Total NXD Burned/)).toBeInTheDocument();
  });
});
