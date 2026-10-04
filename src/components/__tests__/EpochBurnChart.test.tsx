import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    isAddress: vi.fn(() => true),
    formatEther: vi.fn((v) => (Number(v) / 1e18).toString()),
  },
}));

// Mock multicall
const mockMulticall = vi.fn();
vi.mock('../../utils/multicall', () => ({
  multicall: (...args: unknown[]) => mockMulticall(...args),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  BarChart: () => React.createElement('span', null, 'BarChart'),
}));

import { EpochBurnChart } from '../EpochBurnChart';

describe('EpochBurnChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockMulticall.mockResolvedValue([
      { success: true, result: 1700000000n }, // firstBurnTimestamp
      { success: true, result: 2n },          // currentEpoch
      { success: true, result: 150000000000000000000n }, // totalNXDBurned (150 NXD)
      {
        success: true,
        result: [
          { epoch: 0, startTime: 1700000000, burned: 50000000000000000000n },
          { epoch: 1, startTime: 1700604800, burned: 60000000000000000000n },
          { epoch: 2, startTime: 1701209600, burned: 40000000000000000000n },
        ],
      }, // getAllEpochsBurnData
    ]);
  });

  it('renders chart with title', () => {
    mockMulticall.mockReturnValue(new Promise(() => {}));
    render(React.createElement(EpochBurnChart, {
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    expect(screen.getByText(/NXDv3 Burn Volume/)).toBeInTheDocument();
  });

  it('shows loading state initially when no cache exists', () => {
    // Return pending promise so it stays loading
    mockMulticall.mockReturnValue(new Promise(() => {}));
    render(React.createElement(EpochBurnChart, {
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    expect(screen.getByText(/Loading epoch data/)).toBeInTheDocument();
  });

  it('shows first burn date label', () => {
    mockMulticall.mockReturnValue(new Promise(() => {}));
    render(React.createElement(EpochBurnChart, {
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    expect(screen.getByText(/First Burn/)).toBeInTheDocument();
  });

  it('shows current epoch label', () => {
    mockMulticall.mockReturnValue(new Promise(() => {}));
    render(React.createElement(EpochBurnChart, {
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    expect(screen.getByText(/Active Epoch/)).toBeInTheDocument();
  });

  it('shows total burned label', () => {
    mockMulticall.mockReturnValue(new Promise(() => {}));
    render(React.createElement(EpochBurnChart, {
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    expect(screen.getByText(/Total NXD Burned/)).toBeInTheDocument();
  });

  it('fetches and renders epoch data bars correctly', async () => {
    render(React.createElement(EpochBurnChart, {
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    await waitFor(() => {
      expect(screen.getByText('Epoch #2')).toBeInTheDocument();
    });

    expect(screen.getByText('Ep #0')).toBeInTheDocument();
    expect(screen.getByText('Ep #1')).toBeInTheDocument();
    expect(screen.getByText('Ep #2')).toBeInTheDocument();
  });

  it('does not render epoch dates under the bars (only the epoch number)', () => {
    mockMulticall.mockReturnValue(new Promise(() => {}));
    const cachedData = {
      firstBurnDateFormatted: '2023-11-15 UTC',
      currentEpochNum: 5,
      totalBurnedEth: 500,
      epochs: [
        {
          epochIndex: 0,
          startDateFormatted: '2023-11-15 UTC',
          startTimestamp: 1700000000,
          burnedAmountEth: 100,
          isCurrentEpoch: false,
        },
        {
          epochIndex: 5,
          startDateFormatted: '2023-12-20 UTC',
          startTimestamp: 1703000000,
          burnedAmountEth: 400,
          isCurrentEpoch: true,
        },
      ],
    };
    localStorage.setItem('nxdv3_epoch_burn_cache_v3', JSON.stringify(cachedData));

    render(React.createElement(EpochBurnChart, {
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    // Epoch number labels stay under the bars
    expect(screen.getByText('Ep #0')).toBeInTheDocument();
    expect(screen.getByText('Ep #5')).toBeInTheDocument();
    // The per-epoch date is no longer rendered under the bars
    expect(screen.queryByText(/2023-12-20/)).not.toBeInTheDocument();
  });

  it('shows hovered epoch details on mouse enter and clears on mouse leave', async () => {
    render(React.createElement(EpochBurnChart, {
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    await waitFor(() => {
      expect(screen.getByText('Ep #1')).toBeInTheDocument();
    });

    const ep1Label = screen.getByText('Ep #1');
    const barContainer = ep1Label.parentElement!;

    fireEvent.mouseEnter(barContainer);
    expect(screen.getByText(/60 NXD/)).toBeInTheDocument();

    fireEvent.mouseLeave(barContainer);
    expect(screen.queryByText(/60 NXD/)).not.toBeInTheDocument();
  });

  it('loads and uses cached epoch data from localStorage', () => {
    mockMulticall.mockReturnValue(new Promise(() => {}));
    const cachedData = {
      firstBurnDateFormatted: '2023-11-15 UTC',
      currentEpochNum: 5,
      totalBurnedEth: 500,
      epochs: [
        {
          epochIndex: 0,
          startDateFormatted: '2023-11-15 UTC',
          startTimestamp: 1700000000,
          burnedAmountEth: 100,
          isCurrentEpoch: false,
        },
        {
          epochIndex: 5,
          startDateFormatted: '2023-12-20 UTC',
          startTimestamp: 1703000000,
          burnedAmountEth: 400,
          isCurrentEpoch: true,
        },
      ],
    };
    localStorage.setItem('nxdv3_epoch_burn_cache_v3', JSON.stringify(cachedData));

    render(React.createElement(EpochBurnChart, {
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    expect(screen.getByText('Epoch #5')).toBeInTheDocument();
    expect(screen.getByText('Ep #0')).toBeInTheDocument();
    expect(screen.getByText('Ep #5')).toBeInTheDocument();
  });
});

