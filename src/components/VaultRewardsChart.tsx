/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useProtocol } from '../context/ProtocolContext';
import { useWallet } from '../context/WalletContext';
import { ethers } from 'ethers';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { UserCheck } from 'lucide-react';
import { fetchVaultRewards, VaultRewardsDay } from '../utils/vaultRewards';
import { RangeSlider } from './RangeSlider';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AXIS_COLORS = {
  eth: '#10b981',
  xen: '#facc15',
};

function buildOptions(
  color: string,
  unitLabel: string,
  formatTick: (v: number) => string,
  formatTooltipTitle?: (dataIndex: number) => string
) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f3f4f6',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          ...(formatTooltipTitle
            ? {
                title: (items: any[]) =>
                  items.length > 0 ? formatTooltipTitle(items[0].dataIndex) : '',
              }
            : {}),
          label: (context: any) =>
            ` ${context.dataset.label}: ${Number(context.parsed.y).toLocaleString(undefined, {
              maximumFractionDigits: 6,
            })} ${unitLabel}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: unitLabel,
          color,
          font: { size: 11, weight: 'bold' as const },
        },
        ticks: { color, callback: (v: any) => formatTick(Number(v)) },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  };
}

function formatEthTick(v: number) {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return v.toFixed(3);
}

function formatXenTick(v: number) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return v.toFixed(0);
}

export const VaultRewardsChart: React.FC = React.memo(() => {
  const { globalData, userData } = useProtocol();
  const { isConnected } = useWallet();

  const [daily, setDaily] = useState<VaultRewardsDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-chart visible windows (indices into `daily`)
  const [ethRange, setEthRange] = useState<[number, number]>([0, 0]);
  const [xenRange, setXenRange] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchVaultRewards();
        if (!mounted) return;
        setDaily(data);
        const last = Math.max(0, data.length - 1);
        setEthRange([0, last]);
        setXenRange([0, last]);
      } catch (err) {
        if (mounted) {
          setError('Failed to load vault rewards history.');
          console.error('[VaultRewardsChart] Error:', err);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Keep ranges in bounds if data changes
  useEffect(() => {
    const last = Math.max(0, daily.length - 1);
    setEthRange(([lo, hi]) => [Math.min(lo, last), Math.min(hi, last)]);
    setXenRange(([lo, hi]) => [Math.min(lo, last), Math.min(hi, last)]);
  }, [daily.length]);

  const stats = useMemo(() => {
    const ethToVault = parseFloat(ethers.formatEther(globalData.totalETHToStakingVault || 0n));
    const vaultStaked = parseFloat(ethers.formatEther(globalData.totalVaultStaked || 0n));
    const nxdTotalSupply = parseFloat(ethers.formatEther(globalData.nxdTotalSupply || 0n));
    const stakingRate = nxdTotalSupply > 0 ? (vaultStaked / nxdTotalSupply) * 100 : 0;
    const xenSentToVault = parseFloat(ethers.formatEther(globalData.totalXENBought || 0n));

    const userPendingETH = parseFloat(ethers.formatEther(userData?.pendingETH || 0n));
    const userPendingXEN = parseFloat(ethers.formatUnits(userData?.pendingXEN || 0n, 18));
    const userStaked = parseFloat(ethers.formatEther(userData?.stakedBalance || 0n));
    const userSharePct = vaultStaked > 0 ? (userStaked / vaultStaked) * 100 : 0;

    return {
      ethToVault,
      xenSentToVault,
      vaultStaked,
      nxdTotalSupply,
      stakingRate,
      userPendingETH,
      userPendingXEN,
      userStaked,
      userSharePct,
    };
  }, [globalData, userData]);

  const ethVisible = useMemo(() => daily.slice(ethRange[0], ethRange[1] + 1), [daily, ethRange]);
  const xenVisible = useMemo(() => daily.slice(xenRange[0], xenRange[1] + 1), [daily, xenRange]);

  const ethChartData = useMemo(
    () => ({
      labels: ethVisible.map((d) => `Ep #${d.epoch}`),
      datasets: [
        {
          label: 'ETH Inflow',
          data: ethVisible.map((d) => parseFloat(ethers.formatEther(d.ethWei))),
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          borderColor: AXIS_COLORS.eth,
          borderWidth: 1.5,
          borderRadius: 4,
          barPercentage: 0.7,
        },
      ],
    }),
    [ethVisible]
  );

  const xenChartData = useMemo(
    () => ({
      labels: xenVisible.map((d) => `Ep #${d.epoch}`),
      datasets: [
        {
          label: 'XEN Inflow',
          data: xenVisible.map((d) => parseFloat(ethers.formatEther(d.xenWei))),
          backgroundColor: 'rgba(250, 204, 21, 0.85)',
          borderColor: AXIS_COLORS.xen,
          borderWidth: 1.5,
          borderRadius: 4,
          barPercentage: 0.7,
        },
      ],
    }),
    [xenVisible]
  );

  const ethOptions = useMemo(
    () =>
      buildOptions(
        AXIS_COLORS.eth,
        'ETH',
        formatEthTick,
        (i) => (ethVisible[i] ? `Ep #${ethVisible[i].epoch} (${ethVisible[i].date})` : '')
      ),
    [ethVisible]
  );
  const xenOptions = useMemo(
    () =>
      buildOptions(
        AXIS_COLORS.xen,
        'XEN',
        formatXenTick,
        (i) => (xenVisible[i] ? `Ep #${xenVisible[i].epoch} (${xenVisible[i].date})` : '')
      ),
    [xenVisible]
  );

  const lastIdx = Math.max(0, daily.length - 1);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <p className="text-xs text-secondary">
          Historical ETH and XEN reward inflows sent to the Vault per 7-day epoch. 
        </p>
      </div>

      {isLoading ? (
        <div className="card p-6 text-center text-secondary">Loading rewards history…</div>
      ) : error ? (
        <div className="card p-6 text-center text-red-400">{error}</div>
      ) : daily.length === 0 ? (
        <div className="card p-6 text-center text-secondary">No reward inflows recorded yet.</div>
      ) : (
        <>
          {/* ETH chart section */}
          <div className="flex flex-col gap-3">
            <div className="card px-2 py-2.5 flex flex-col min-w-0">
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  width: '100%',
                  whiteSpace: 'nowrap',
                  textAlign: 'left',
                  lineHeight: 1.2,
                }}
              >
                ETH Sent to Vault (Cumulative)
              </span>
              <span
                className="text-sm font-bold text-emerald-400 mt-1 truncate"
                style={{ whiteSpace: 'nowrap' }}
              >
                {stats.ethToVault.toLocaleString(undefined, {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 4,
                })}{' '}
                ETH
              </span>
            </div>
            <div className="card p-4 relative flex flex-col epochs-chart-box">
              <div
                className="vault-rewards-header"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}
              >
                <span style={{ fontSize: '11px', color: AXIS_COLORS.eth, fontWeight: 700 }}>
                  ETH Inflow per 7-Day Epoch
                </span>
              </div>
              <div className="flex-1 min-h-0" style={{ minHeight: '220px' }}>
                <Bar data={ethChartData as any} options={ethOptions as any} />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <RangeSlider min={0} max={lastIdx} value={ethRange} onChange={setEthRange} />
              </div>
            </div>
          </div>

          {/* Divider line between ETH and XEN sections */}
          <div style={{ margin: '1.5rem 0', borderTop: '1px solid var(--border-color)' }} />

          {/* XEN chart section */}
          <div className="flex flex-col gap-3">
            <div className="card px-2 py-2.5 flex flex-col min-w-0">
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  width: '100%',
                  whiteSpace: 'nowrap',
                  textAlign: 'left',
                  lineHeight: 1.2,
                }}
              >
                XEN Sent to Vault (Cumulative)
              </span>
              <span
                className="text-sm font-bold text-yellow-400 mt-1 truncate"
                style={{ whiteSpace: 'nowrap' }}
              >
                {stats.xenSentToVault.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                XEN
              </span>
            </div>
            <div className="card p-4 relative flex flex-col epochs-chart-box">
              <div
                className="vault-rewards-header"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}
              >
                <span style={{ fontSize: '11px', color: AXIS_COLORS.xen, fontWeight: 700 }}>
                  XEN Inflow per 7-Day Epoch
                </span>
              </div>
              <div className="flex-1 min-h-0" style={{ minHeight: '220px' }}>
                <Bar data={xenChartData as any} options={xenOptions as any} />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <RangeSlider min={0} max={lastIdx} value={xenRange} onChange={setXenRange} />
              </div>
            </div>
          </div>
        </>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          marginTop: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserCheck size={16} className="text-emerald-400 flex-shrink-0" />
          <span style={{ wordBreak: 'break-word' }}>Your share in the Staking Vault:</span>
        </div>
        <div>
          {isConnected ? (
            <span style={{ wordBreak: 'break-word' }}>
              <strong className="text-emerald-400">{stats.userSharePct.toFixed(3)}%</strong> (
              {stats.userStaked.toLocaleString(undefined, { maximumFractionDigits: 2 })} NXD)
            </span>
          ) : (
            <span className="text-secondary" style={{ fontStyle: 'italic' }}>
              (Connect wallet to view)
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
