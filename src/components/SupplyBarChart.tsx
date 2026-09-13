import React, { useMemo } from 'react';
import { useProtocol } from '../context/ProtocolContext';
import { ethers } from 'ethers';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { RefreshCw, Layers, Flame, Shield, Clock } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

export const SupplyBarChart: React.FC<{
  nxdAddress?: string;
  vaultAddress?: string;
  taxRecipientAddress?: string;
  dxnAddress?: string;
  protocolAddress?: string;
  XenAddress?: string;
}> = React.memo(() => {
  const { globalData, isLoadingGlobal } = useProtocol();

  const sd = useMemo(() => {
    const ts = parseFloat(ethers.formatEther(globalData.nxdTotalSupply || 0n));
    const b = parseFloat(ethers.formatEther(globalData.totalNXDBurned || 0n));
    const s = parseFloat(ethers.formatEther(globalData.totalVaultStaked || 0n));
    const maxSup = parseFloat(
      ethers.formatEther(globalData.nxdMaxSupply || 100000000n * 10n ** 18n)
    );
    const l = Math.max(0, ts - s);
    const totalDenom = ts + b;
    const sMaxR = maxSup > 0 ? Math.round((s / maxSup) * 100) : 0;
    const lMaxR = maxSup > 0 ? Math.round((l / maxSup) * 100) : 0;
    const bMaxR = maxSup > 0 ? Math.round((b / maxSup) * 100) : 0;

    return {
      ts,
      b,
      s,
      l,
      sR: totalDenom > 0 ? (s / totalDenom) * 100 : 0,
      bR: totalDenom > 0 ? (b / totalDenom) * 100 : 0,
      lR: totalDenom > 0 ? (l / totalDenom) * 100 : 0,
      sMaxR,
      lMaxR,
      bMaxR,
    };
  }, [globalData]);

  const cfg = useMemo(
    () => ({
      labels: ['Staked', 'Liquid', 'Burned'],
      datasets: [
        {
          data: [sd.s, sd.l, sd.b],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
          borderWidth: 0,
        },
      ],
    }),
    [sd]
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <p className="text-xs text-secondary">
          NXDv3 Supply Structure: Staked, Liquid, and Burned.
        </p>
      </div>

      <div
        className="supply-chart-container w-full"
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Left: Doughnut Chart */}
        <div
          className="card p-4 flex flex-col items-center justify-center relative supply-chart-side supply-chart-doughnut"
          style={{ flex: '1 1 280px', minWidth: '260px' }}
        >
          {!globalData.isLoaded && isLoadingGlobal && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 rounded text-white gap-2">
              <RefreshCw size={20} className="animate-spin text-primary" />
              <span>Loading...</span>
            </div>
          )}
          <div style={{ width: '100%', maxWidth: '280px', height: '220px', position: 'relative' }}>
            <Doughnut
              data={cfg}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />
          </div>
          {/* 3 Colored Squares Row below the chart */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.4rem',
              marginTop: '0.75rem',
              width: '100%',
              fontSize: '0.75rem',
              padding: '0 2px',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
            >
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '2px',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Staked</span>
              <span style={{ fontWeight: 700, color: '#3b82f6' }}>{sd.sMaxR}%</span>
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
            >
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  backgroundColor: '#10b981',
                  borderRadius: '2px',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Liquid</span>
              <span style={{ fontWeight: 700, color: '#10b981' }}>{sd.lMaxR}%</span>
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
            >
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  backgroundColor: '#f59e0b',
                  borderRadius: '2px',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Burned</span>
              <span style={{ fontWeight: 700, color: '#f59e0b' }}>{sd.bMaxR}%</span>
            </div>
          </div>
        </div>

        {/* Right: Vertical Metric Stack */}
        <div
          className="flex flex-col gap-2 supply-chart-side supply-metrics-stack"
          style={{ flex: '1 1 200px', minWidth: '200px', maxWidth: '260px' }}
        >
          <div className="card px-3 py-1 flex flex-col">
            <span className="text-xs text-secondary flex items-center gap-1.5">
              <Clock size={13} className="text-gray-300" /> Total
            </span>
            <span className="text-lg font-bold text-white" style={{ marginTop: '0.05rem' }}>
              {sd.ts.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="card px-3 py-1 flex flex-col">
            <span className="text-xs text-secondary flex items-center gap-1.5">
              <Shield size={13} className="text-blue-400" /> Staked
            </span>
            <span className="text-lg font-bold text-blue-400" style={{ marginTop: '0.05rem' }}>
              {sd.s.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-blue-400 font-medium" style={{ marginTop: '0rem' }}>
              {sd.sR.toFixed(1)}% Ratio
            </span>
          </div>
          <div className="card px-3 py-1 flex flex-col">
            <span className="text-xs text-secondary flex items-center gap-1.5">
              <Layers size={13} className="text-emerald-400" /> Liquid
            </span>
            <span className="text-lg font-bold text-emerald-400" style={{ marginTop: '0.05rem' }}>
              {sd.l.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span
              className="text-[11px] text-emerald-400 font-medium"
              style={{ marginTop: '0rem' }}
            >
              {sd.lR.toFixed(1)}% Floating
            </span>
          </div>
          <div className="card px-3 py-1 flex flex-col">
            <span className="text-xs text-secondary flex items-center gap-1.5">
              <Flame size={13} className="text-yellow-400" /> Burned
            </span>
            <span className="text-lg font-bold text-yellow-400" style={{ marginTop: '0.05rem' }}>
              {sd.b.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-yellow-400 font-medium" style={{ marginTop: '0rem' }}>
              {sd.bR.toFixed(1)}% Burned
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
