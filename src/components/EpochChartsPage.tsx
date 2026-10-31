import React, { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Flame,
  Layers,
  Coins,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { EpochBurnChart } from './EpochBurnChart';
import { SupplyBarChart } from './SupplyBarChart';
import { MintingTierChart } from './MintingTierChart';
import { VaultRewardsChart } from './VaultRewardsChart';

interface EpochChartsPageProps {
  onBack: () => void;
  nxdAddress?: string;
  XenAddress?: string;
  dxnAddress?: string;
  protocolAddress?: string;
  taxRecipientAddress?: string;
}

export const EpochChartsPage: React.FC<EpochChartsPageProps> = ({
  onBack,
  nxdAddress,
  XenAddress,
  dxnAddress,
  protocolAddress,
  taxRecipientAddress,
}) => {
  const [showEpochBurnInfo, setShowEpochBurnInfo] = useState(false);
  const [showSupplyInfo, setShowSupplyInfo] = useState(false);
  const [showMintInfo, setShowMintInfo] = useState(false);
  const [showVaultInfo, setShowVaultInfo] = useState(false);
  return (
    <main className="main-content">
      <div
        className="hero-section"
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              zIndex: 10,
            }}
          >
            <ArrowLeft size={18} className="icon-gold" />
            <span>Back to Dashboard</span>
          </button>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1>NXDv3 Protocol — Economic Charts Hub</h1>
          <p>Comprehensive protocol analytics and economic metrics</p>
          <p>Real-time data across all 4 core protocol dimensions.</p>
        </div>
      </div>

      <div className="epochs-charts-grid">
        {/* Chart Window 1: Supply & Distribution */}
        <div className="epochs-chart-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart3 size={22} className="icon-gold" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Supply & Distribution
              </h3>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setShowSupplyInfo(!showSupplyInfo)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '0.8rem',
              }}
              title="Toggle Chart Description"
            >
              <Info size={14} className="icon-gold" />
              <span>{showSupplyInfo ? 'Hide description' : 'Info'}</span>
              {showSupplyInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showSupplyInfo && (
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div>
                <strong>Type:</strong> Doughnut Chart
              </div>
              <div>
                <strong>What it shows:</strong> Breakdown of the total emitted NXDv3 supply into 3
                categories: Staked in Vault, Liquid Circulating, and Burned.
              </div>
              <div style={{ color: 'var(--text-primary)' }}>
                <strong>Why it is essential:</strong> Used for immediate assessment of the Staking
                Ratio (% of frozen supply) and real floating (liquid supply). Low liquid supply with
                a high Staking Ratio % indicates strong fundamentals and lower selling pressure.
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <SupplyBarChart
              nxdAddress={nxdAddress}
              taxRecipientAddress={taxRecipientAddress}
              dxnAddress={dxnAddress}
              protocolAddress={protocolAddress}
              XenAddress={XenAddress}
            />
          </div>
        </div>

        {/* Chart Window 2: Epoch Burn Dynamics */}
        <div className="epochs-chart-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Flame size={22} className="icon-gold" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Epoch Burn Dynamics
              </h3>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setShowEpochBurnInfo(!showEpochBurnInfo)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '0.8rem',
              }}
              title="Toggle Chart Description"
            >
              <Info size={14} className="icon-gold" />
              <span>{showEpochBurnInfo ? 'Hide description' : 'Info'}</span>
              {showEpochBurnInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showEpochBurnInfo && (
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div>
                <strong>Type:</strong> Bar Chart
              </div>
              <div>
                <strong>What it shows:</strong> Amount of burned NXDv3 broken down by cycles (Weekly
                epochs).
              </div>
              <div style={{ color: 'var(--text-primary)' }}>
                <strong>Why it is essential:</strong> NXDv3 is a deflationary token. This chart
                allows the user to directly assess deflationary pressure and network activity level
                in a given period. It shows whether deflation is accelerating or decelerating.
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <EpochBurnChart nxdAddress={nxdAddress} />
          </div>
        </div>

        {/* Chart Window 3: Vault Rewards & Yield */}
        <div className="epochs-chart-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Coins size={22} className="icon-gold" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Vault Rewards & Yield
              </h3>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setShowVaultInfo(!showVaultInfo)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '0.8rem',
              }}
              title="Toggle Chart Description"
            >
              <Info size={14} className="icon-gold" />
              <span>{showVaultInfo ? 'Hide description' : 'Info'}</span>
              {showVaultInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showVaultInfo && (
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div>
                <strong>Type:</strong> Bar Chart
              </div>
              <div>
                <strong>What it shows:</strong> Growth in total value of ETH and XEN rewards
                transferred to the Staking Vault since the protocol's inception.
              </div>
              <div style={{ color: 'var(--text-primary)' }}>
                <strong>Why it is essential:</strong> Stakers want to see real revenue generated by
                the Vault. This shows historical profitability and reward pool growth over time.
              </div>
            </div>
          )}

          <div
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
            }}
          >
            <VaultRewardsChart />
          </div>
        </div>

        {/* Chart Window 4: Minting Tiers */}
        <div className="epochs-chart-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={22} className="icon-gold" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Minting Tiers
              </h3>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setShowMintInfo(!showMintInfo)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '0.8rem',
              }}
              title="Toggle Chart Description"
            >
              <Info size={14} className="icon-gold" />
              <span>{showMintInfo ? 'Hide description' : 'Info'}</span>
              {showMintInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showMintInfo && (
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div>
                <strong>Type:</strong> Step Line Chart
              </div>
              <div>
                <strong>What it shows:</strong> Current minting tier, current DXNv2/NXDv3 exchange
                rate, and DXNv2 demand across upcoming tiers up to Max Rewards Supply.
              </div>
              <div style={{ color: 'var(--text-primary)' }}>
                <strong>Why it is essential:</strong> Users depositing DXNv2 need to know if they
                are minting under attractive conditions and when tier changes will occur
                (progression rate). This is a key indicator for the depositor's investment decision.
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <MintingTierChart />
          </div>
        </div>
      </div>
    </main>
  );
};
