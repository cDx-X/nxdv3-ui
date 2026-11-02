import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
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
const mockLine = vi.fn();
vi.mock('react-chartjs-2', () => ({
  Line: (props: any) => {
    mockLine(props);
    return React.createElement('div', null, 'LineChart');
  },
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
  it('calculates Tier 2 correctly when minted is in second tier range', () => {
    // maxMintable = 300, tierSize = 100. minted = 150 -> Tier 2 (progress 50%)
    (useProtocol as any).mockReturnValue({
      globalData: {
        isLoaded: true,
        maxMintableDeposit: 300n * 10n ** 18n,
        nxdMintedViaDeposit: 150n * 10n ** 18n,
      },
    });

    render(React.createElement(MintingTierChart));

    expect(screen.getByText('Tier 2')).toBeInTheDocument();
    expect(screen.getByText('0.9100 NXDv3')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('calculates Tier 3 correctly when minted is in third tier range', () => {
    // maxMintable = 300, tierSize = 100. minted = 250 -> Tier 3 (progress 50%)
    (useProtocol as any).mockReturnValue({
      globalData: {
        isLoaded: true,
        maxMintableDeposit: 300n * 10n ** 18n,
        nxdMintedViaDeposit: 250n * 10n ** 18n,
      },
    });

    render(React.createElement(MintingTierChart));

    expect(screen.getByText('Tier 3')).toBeInTheDocument();
    expect(screen.getByText('0.8300 NXDv3')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('handles completion state (100% progress) when maxMintable is reached', () => {
    (useProtocol as any).mockReturnValue({
      globalData: {
        isLoaded: true,
        maxMintableDeposit: 300n * 10n ** 18n,
        nxdMintedViaDeposit: 350n * 10n ** 18n,
      },
    });

    render(React.createElement(MintingTierChart));

    expect(screen.getByText('Tier 3')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('handles fallback when maxMintableDeposit is 0n', () => {
    (useProtocol as any).mockReturnValue({
      globalData: {
        isLoaded: true,
        maxMintableDeposit: 0n,
        nxdMintedViaDeposit: 0n,
      },
    });

    render(React.createElement(MintingTierChart));

    expect(screen.getByText('Tier 1')).toBeInTheDocument();
    expect(screen.getByText('1.0000 NXDv3')).toBeInTheDocument();
  });

  it('executes legend and axis callbacks in chart options', () => {
    mockLine.mockClear();
    render(React.createElement(MintingTierChart));

    expect(mockLine).toHaveBeenCalled();
    const capturedOptions = mockLine.mock.calls[0][0].options;
    expect(capturedOptions).toBeDefined();

    // Test legend labels callback
    const colorFn = capturedOptions.plugins.legend.labels.color;
    expect(colorFn({ datasetIndex: 0 })).toBe('#9ca3af');

    // Test onHover / onLeave
    const target = { style: { cursor: '' } };
    const mockChart = { update: vi.fn() };
    act(() => {
      capturedOptions.plugins.legend.onHover(
        { native: { target } },
        { datasetIndex: 0 },
        { chart: mockChart }
      );
    });
    expect(target.style.cursor).toBe('pointer');
    expect(mockChart.update).toHaveBeenCalledWith('none');

    act(() => {
      capturedOptions.plugins.legend.onLeave({ native: { target } }, {}, { chart: mockChart });
    });
    expect(target.style.cursor).toBe('default');

    // Test yRate ticks callback & afterBuildTicks
    const yRateAxis = { ticks: [] };
    capturedOptions.scales.yRate.afterBuildTicks(yRateAxis);
    expect(yRateAxis.ticks).toHaveLength(3);
    const yRateTickFn = capturedOptions.scales.yRate.ticks.callback;
    expect(yRateTickFn(1)).toBe('1');
    expect(yRateTickFn(0.91)).toBe('0.91');

    // Test yCost ticks callback & afterBuildTicks
    const yCostAxis = { ticks: [] };
    capturedOptions.scales.yCost.afterBuildTicks(yCostAxis);
    expect(yCostAxis.ticks).toHaveLength(3);
    const yCostTickFn = capturedOptions.scales.yCost.ticks.callback;
    expect(yCostTickFn(1)).toBe('1');
    expect(yCostTickFn(1.099)).toBe('1.099');
    expect(yCostTickFn(1.205)).toBe('1.205');
    expect(yCostTickFn(1.15)).toBe('1.150');
  });
});
