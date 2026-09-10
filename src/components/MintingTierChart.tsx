/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { useProtocol } from '../context/ProtocolContext';
import { ethers } from 'ethers';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const MintingTierChart: React.FC = React.memo(() => {
  const { globalData } = useProtocol();
  const [hoveredDatasetIndex, setHoveredDatasetIndex] = React.useState<number | null>(null);

  const tierData = useMemo(() => {
    const maxMintable = parseFloat(
      ethers.formatEther(
        globalData.maxMintableDeposit > 0n
          ? globalData.maxMintableDeposit
          : 100000000000000000000000000n
      )
    );
    const tierSize = maxMintable / 3;
    const totalMinted = parseFloat(ethers.formatEther(globalData.nxdMintedViaDeposit));
    const currentTierIndex = Math.min(
      3,
      Math.max(1, Math.floor(totalMinted / (tierSize || 1)) + 1)
    );
    const tierProgressPct = (() => {
      if (totalMinted >= maxMintable) return 100;
      if (currentTierIndex === 1) {
        return Math.min(100, Math.max(0, (totalMinted / (tierSize || 1)) * 100));
      } else if (currentTierIndex === 2) {
        return Math.min(100, Math.max(0, ((totalMinted - tierSize) / (tierSize || 1)) * 100));
      } else {
        return Math.min(100, Math.max(0, ((totalMinted - tierSize * 2) / (tierSize || 1)) * 100));
      }
    })();

    const rate1 = 1.0;
    const rate2 = 0.91;
    const rate3 = 0.83;

    const rawTiers = [
      { tier: 1, rate: rate1 },
      { tier: 2, rate: rate2 },
      { tier: 3, rate: rate3 },
    ];

    const tiers = rawTiers.map((t) => ({
      tier: t.tier,
      rate: parseFloat(t.rate.toFixed(4)),
      cost: parseFloat((t.rate > 0 ? 1 / t.rate : 1).toFixed(3)),
      isCurrent: t.tier === currentTierIndex,
    }));

    const currentRate = rawTiers.find((t) => t.tier === currentTierIndex)?.rate || rate1;

    return {
      currentTierIndex,
      tierProgressPct,
      currentRate,
      totalMintedM: totalMinted / 1e6,
      maxMintableM: maxMintable / 1e6,
      tiers,
    };
  }, [globalData]);

  const rateMin = 0.78;
  const rateMax = 1.03;

  const costMin = 0.94;
  const costMax = 1.26;

  const chartConfigData = useMemo(
    () => ({
      labels: tierData.tiers.map((t) => `Tier ${t.tier}`),
      datasets: [
        {
          type: 'line' as const,
          label: 'Mint Rate (NXDv3/DXNv2)',
          data: tierData.tiers.map((t) => t.rate),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          borderWidth: 3,
          pointBackgroundColor: tierData.tiers.map((t) => (t.isCurrent ? '#ffffff' : '#f59e0b')),
          pointBorderColor: '#f59e0b',
          pointBorderWidth: tierData.tiers.map((t) => (t.isCurrent ? 3 : 1)),
          pointRadius: tierData.tiers.map((t) => (t.isCurrent ? 7 : 4)),
          yAxisID: 'yRate',
          fill: true,
          tension: 0.3,
        },
        {
          type: 'bar' as const,
          label: 'DXNv2 Cost / NXDv3',
          data: tierData.tiers.map((t) => t.cost),
          backgroundColor: tierData.tiers.map((t) =>
            t.isCurrent ? 'rgba(59, 130, 246, 0.8)' : 'rgba(107, 114, 128, 0.25)'
          ),
          borderColor: tierData.tiers.map((t) => (t.isCurrent ? '#3b82f6' : '#6b7280')),
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'yCost',
        },
      ],
    }),
    [tierData]
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-secondary">DXNv2 to NXDv3 minting rate dynamics by tier.</p>
        </div>
      </div>

      <div className="epoch-summary-grid">
        <div className="card px-2 py-2.5 flex flex-col min-w-0">
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>Current Tier</span>
          </div>
          <span
            className="text-base font-bold text-yellow-400 mt-1 truncate"
            style={{ whiteSpace: 'nowrap' }}
          >
            Tier {tierData.currentTierIndex}
          </span>
        </div>
        <div className="card px-2 py-2.5 flex flex-col min-w-0">
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>Mint Rate</span>
          </div>
          <span
            className="text-sm font-bold text-emerald-400 mt-1 truncate"
            style={{ whiteSpace: 'nowrap' }}
          >
            {tierData.currentRate.toFixed(4)} NXDv3
          </span>
        </div>
        <div className="card px-2 py-2.5 flex flex-col min-w-0">
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>DXNv2 Cost</span>
          </div>
          <span
            className="text-sm font-bold text-blue-400 mt-1 truncate"
            style={{ whiteSpace: 'nowrap' }}
          >
            {(tierData.currentRate > 0 ? 1 / tierData.currentRate : 1).toFixed(4)} DXNv2
          </span>
        </div>
        <div className="card px-2 py-2.5 flex flex-col min-w-0">
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>Tier Progress</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-400 h-full"
              style={{ width: `${tierData.tierProgressPct}%` }}
            />
          </div>
          <span
            className="text-xs font-semibold text-gray-400 mt-1 text-right"
            style={{ whiteSpace: 'nowrap' }}
          >
            {tierData.tierProgressPct.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="card p-4 relative epochs-chart-box minting-chart-box">
        <Line
          data={chartConfigData as any}
          options={
            {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'top' as const,
                  align: 'center' as const,
                  labels: {
                    boxWidth: 10,
                    padding: 8,
                    color: (ctx: any) =>
                      ctx.datasetIndex === hoveredDatasetIndex ? '#fef08a' : '#9ca3af',
                    font: { size: 10 },
                  },
                  onHover: (e: any, legendItem: any, legend: any) => {
                    if (e.native?.target) {
                      e.native.target.style.cursor = 'pointer';
                    }
                    setHoveredDatasetIndex(legendItem.datasetIndex);
                    legend.chart.update('none');
                  },
                  onLeave: (e: any, _legendItem: any, legend: any) => {
                    if (e.native?.target) {
                      e.native.target.style.cursor = 'default';
                    }
                    setHoveredDatasetIndex(null);
                    legend.chart.update('none');
                  },
                },
              },
              scales: {
                x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                yRate: {
                  type: 'linear',
                  position: 'left',
                  min: rateMin,
                  max: rateMax,
                  afterBuildTicks: (axis: any) => {
                    axis.ticks = [{ value: 0.83 }, { value: 0.91 }, { value: 1.0 }];
                  },
                  ticks: {
                    color: '#f59e0b',
                    callback: (v: any) => {
                      const n = Number(Number(v).toFixed(2));
                      if (n === 1) return '1';
                      return n.toFixed(2);
                    },
                  },
                  grid: { color: 'rgba(255,255,255,0.05)' },
                },
                yCost: {
                  type: 'linear',
                  position: 'right',
                  min: costMin,
                  max: costMax,
                  afterBuildTicks: (axis: any) => {
                    axis.ticks = [{ value: 1.0 }, { value: 1.099 }, { value: 1.205 }];
                  },
                  ticks: {
                    color: '#60a5fa',
                    callback: (v: any) => {
                      const n = Number(Number(v).toFixed(3));
                      if (n === 1) return '1';
                      if (Math.abs(n - 1.099) < 0.0005) return '1.099';
                      if (Math.abs(n - 1.205) < 0.0005) return '1.205';
                      return n.toFixed(3);
                    },
                  },
                  grid: { drawOnChartArea: false },
                },
              },
            } as any
          }
        />
      </div>
    </div>
  );
});
