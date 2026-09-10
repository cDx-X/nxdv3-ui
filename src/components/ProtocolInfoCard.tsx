import React, { useState } from 'react';
import { useProtocol } from '../context/ProtocolContext';
import { Info, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface ProtocolInfoCardProps {
  protocolAddress: string;
  nxdAddress: string;
}

export const ProtocolInfoCard: React.FC<ProtocolInfoCardProps> = React.memo(() => {
  const { refreshAll, isLoadingGlobal } = useProtocol();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="card">
      <div
        className="card-header justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <div className="flex items-center gap-2">
          <Info size={18} className="icon-gold" />
          <h2>Protocol Info - tokenomics and mechanics</h2>
          {isExpanded ? (
            <ChevronUp size={16} className="text-gray-400 ml-1" />
          ) : (
            <ChevronDown size={16} className="text-gray-400 ml-1" />
          )}
        </div>
        <button
          className="btn-icon"
          onClick={(e) => {
            e.stopPropagation();
            refreshAll();
          }}
          title="Refresh"
          disabled={isLoadingGlobal}
        >
          <RefreshCw size={14} className={isLoadingGlobal ? 'animate-spin' : ''} />
        </button>
      </div>

      {isExpanded && (
        <>
          <div
            className="admin-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Transfer Tax Breakdown */}
            <div
              className="admin-section"
              style={{
                background: 'var(--bg-primary)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3
                  className="text-sm font-semibold mb-3 flex items-center gap-1"
                  style={{ color: 'var(--accent-gold)' }}
                >
                  Transfer Tax Breakdown (5%)
                </h3>
                <div className="flex flex-col gap-2 mb-3">
                  <div
                    className="py-1 px-2 text-xs"
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Burn NXDv3 - 1.5%
                  </div>
                  <div
                    className="py-1 px-2 text-xs"
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Stake DXNv2 - 0.5%
                  </div>
                  <div
                    className="py-1 px-2 text-xs"
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Add to LP - 3%
                  </div>
                </div>
              </div>
              <p
                className="card-description text-xs"
                style={{ margin: 0, color: 'var(--text-secondary)' }}
              >
                Charged on sells and on wallet-to-wallet transfers. Buying and staking are exempt.
              </p>
            </div>

            {/* ETH Fee Split */}
            <div
              className="admin-section"
              style={{
                background: 'var(--bg-primary)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <h3
                className="text-sm font-semibold mb-3 flex items-center gap-1"
                style={{ color: 'var(--accent-blue)' }}
              >
                ETH Fee Split
              </h3>
              <div className="flex flex-col gap-2">
                <div
                  className="py-1 px-2 text-xs"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Buy + Burn NXDv3 - 38.5%
                </div>
                <div
                  className="py-1 px-2 text-xs"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Stake DXNv2 - 24.5%
                </div>
                <div
                  className="py-1 px-2 text-xs"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Burn DXNv2 - 7%
                </div>
                <div
                  className="py-1 px-2 text-xs"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  ETH to Staking Vault - 15%
                </div>
                <div
                  className="py-1 px-2 text-xs"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  XEN to Staking Vault - 15%
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
