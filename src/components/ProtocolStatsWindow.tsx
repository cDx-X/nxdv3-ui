import React from 'react';
import { useProtocol } from '../context/ProtocolContext';
import { ethers } from 'ethers';
import {
  RefreshCw,
  Activity,
  Flame,
  Coins,
  ShieldCheck,
  PieChart,
  Sparkles,
  Clock,
  ShieldAlert,
  Lock,
} from 'lucide-react';

interface ProtocolStatsWindowProps {
  protocolAddress?: string;
  nxdAddress?: string;
}

interface FormattedStats {
  effectiveSupply: string;
  totalMinted: string;
  totalNXDBurned: string;
  totalDXNBurned: string;
  totalDXNStaked: string;
  totalNXDStaked: string;
  totalETHSentToVault: string;
  totalXENSentToVault: string;
  maxSupply: string;
  burnedPercentage: string;
  burnedPercentageNum: number;
}

export const ProtocolStatsWindow: React.FC<ProtocolStatsWindowProps> = React.memo(() => {
  const { globalData, refreshAll, isLoadingGlobal } = useProtocol();

  const stats: FormattedStats = React.useMemo(() => {
    const effSupply = ethers.formatEther(globalData.effectiveSupply || 0n);
    const minted = ethers.formatEther(globalData.totalMinted || 0n);
    const nxdBurned = ethers.formatEther(globalData.totalNXDBurned || 0n);
    const dxnBurned = ethers.formatEther(globalData.totalDXNBurned || 0n);
    const dxnStaked = ethers.formatEther(globalData.totalDXNStaked || 0n);
    const nxdStaked = ethers.formatEther(globalData.totalVaultStaked || 0n);
    const ethSent = ethers.formatEther(globalData.totalETHSentToVault || 0n);
    const xenSent = ethers.formatEther(globalData.totalXENSentToVault || 0n);
    const maxSup = ethers.formatEther(globalData.nxdMaxSupply || 0n);
    const burnPct = globalData.burnedPercentage || 0;

    return {
      effectiveSupply: parseFloat(effSupply).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      totalMinted: parseFloat(minted).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      totalNXDBurned: parseFloat(nxdBurned).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      totalDXNBurned: parseFloat(dxnBurned).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      totalDXNStaked: parseFloat(dxnStaked).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      totalNXDStaked: parseFloat(nxdStaked).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      totalETHSentToVault: parseFloat(ethSent).toLocaleString(undefined, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
      totalXENSentToVault: parseFloat(xenSent).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      maxSupply: parseFloat(maxSup).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      burnedPercentage: `${burnPct.toFixed(2)}%`,
      burnedPercentageNum: burnPct,
    };
  }, [globalData]);

  return (
    <div className="card" style={{ width: '100%', marginBottom: '1.5rem' }}>
      <div className="card-header justify-between">
        <div className="flex items-center gap-2">
          <Activity size={20} className="icon-gold" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Voltage Mane</h2>
        </div>
        <button
          className="btn-icon"
          onClick={() => refreshAll(true)}
          title="Refresh All Metrics"
          disabled={isLoadingGlobal}
        >
          <RefreshCw size={15} className={isLoadingGlobal ? 'animate-spin' : ''} />
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
          gap: '0.85rem',
          marginTop: '0.5rem',
        }}
      >
        {/* 1. Max Supply (NXD) */}
        <div
          className="stat-box"
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <PieChart size={13} style={{ color: 'var(--accent-gold)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Max Supply (NXDv3)
            </span>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {stats.maxSupply}
          </span>
        </div>

        {/* 2. Effective Supply */}
        <div
          className="stat-box"
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <ShieldCheck size={13} style={{ color: 'var(--accent-gold)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Effective Supply (NXDv3)
            </span>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {stats.effectiveSupply}
          </span>
        </div>

        {/* 3. Total NXD Mined (Minted) */}
        <div
          className="stat-box"
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Sparkles size={13} style={{ color: '#60a5fa' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total NXDv3 Mined
            </span>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {stats.totalMinted}
          </span>
        </div>

        {/* 4. Total NXD Burned */}
        <div
          className="stat-box"
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Flame size={13} style={{ color: '#f87171' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total NXDv3 Burned
            </span>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f87171' }}>
            {stats.totalNXDBurned}
          </span>
        </div>

        {/* 5. % NXD Burned (vs Max Supply) */}
        <div
          className="stat-box"
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Flame size={13} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              % NXDv3 Burned
            </span>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ef4444' }}>
            {stats.burnedPercentage}
          </span>
          {/* Mini progress bar */}
          <div
            style={{
              width: '80%',
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              marginTop: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, stats.burnedPercentageNum))}%`,
                height: '100%',
                backgroundColor: '#ef4444',
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* 6. Total NXD Staked */}
        <div
          className="stat-box"
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Lock size={13} style={{ color: '#a78bfa' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total NXDv3 Staked
            </span>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#a78bfa' }}>
            {stats.totalNXDStaked}
          </span>
        </div>

        {/* 7. Total ETH Sent to Vault */}
        <div
          className="stat-box"
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Coins size={13} style={{ color: '#34d399' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              ETH Sent to Vault
            </span>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399' }}>
            {stats.totalETHSentToVault} ETH
          </span>
        </div>

        {/* 8. Total XEN Sent to Vault */}
        <div
          className="stat-box"
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Coins size={13} style={{ color: '#facc15' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              XEN Sent to Vault
            </span>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#facc15' }}>
            {stats.totalXENSentToVault}
          </span>
        </div>

        {/* 9. Total DXN Burned */}
        <div
          className="stat-box"
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Flame size={13} style={{ color: '#fb923c' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total DXNv2 Burned
            </span>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fb923c' }}>
            {stats.totalDXNBurned}
          </span>
        </div>

        {/* 10. Total DXN Staked */}
        <div
          className="stat-box"
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Coins size={13} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total DXNv2 Staked
            </span>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {stats.totalDXNStaked}
          </span>
        </div>

        {/* 11. Withdraw Cooldown */}
        <div
          className="stat-box"
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Clock size={13} style={{ color: 'var(--accent-gold)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Withdraw Cooldown
            </span>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            24 hours
          </span>
        </div>

        {/* 12. Early Withdraw Penalty */}
        <div
          className="stat-box"
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <ShieldAlert size={13} style={{ color: '#f87171' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Early Withdraw Penalty
            </span>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f87171' }}>25%</span>
        </div>
      </div>
    </div>
  );
});
