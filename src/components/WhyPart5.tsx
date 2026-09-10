import React from 'react';

export const WhyPart5: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Section 5 */}
      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}
        >
          5. Tax Handler: <code>TaxRecipient</code> vs. <code>TaxRecipientV3</code>
        </h3>
        <div
          style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          <h4 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Key Highlights</h4>
          <ul
            style={{
              paddingLeft: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              listStyleType: 'disc',
            }}
          >
            <li>
              <strong>Execution Lifecycle:</strong> Transformed from synchronous sub-routine on
              transfers into asynchronous unit invoked by <code>processTax()</code>.
            </li>
            <li>
              <strong>Slippage Protection:</strong> Replaced unsafe <code>0, 0</code> minimum
              amounts with dynamic slippage bounds.
            </li>
          </ul>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <th style={{ padding: '10px' }}>Feature / Parameter</th>
                <th style={{ padding: '10px' }}>NXD (v2)</th>
                <th style={{ padding: '10px' }}>
                  NXDv3 <code>TaxRecipientV3</code>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Call Lifecycle
                </td>
                <td style={{ padding: '10px' }}>
                  Synchronous within <code>_transfer()</code>
                </td>
                <td style={{ padding: '10px' }}>
                  Asynchronous via <code>processTax()</code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  DXN Staking Allocation
                </td>
                <td style={{ padding: '10px' }}>Staked 75% of DXN</td>
                <td style={{ padding: '10px' }}>Stakes 25% of DXN, uses 75% for LP</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Slippage Control
                </td>
                <td style={{ padding: '10px', color: '#ef4444', fontWeight: 600 }}>
                  None (vulnerable to sandwich attacks)
                </td>
                <td style={{ padding: '10px', color: '#10b981', fontWeight: 600 }}>
                  Enforced (default 5%)
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Access Control
                </td>
                <td style={{ padding: '10px' }}>
                  Strictly <code>address(nxd)</code>
                </td>
                <td style={{ padding: '10px' }}>NXD and Protocol</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--border-color)', opacity: 0.3 }} />

      {/* Section 6 */}
      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}
        >
          6. Summary of Removed vs. Added Features
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.35rem' }}>
              Removed Components in NXDv3:
            </h4>
            <ol
              style={{
                paddingLeft: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                listStyleType: 'decimal',
              }}
            >
              <li>
                <strong>
                  <code>Vesting.sol</code>:
                </strong>{' '}
                Team token vesting infrastructure removed.
              </li>
              <li>
                <strong>Developer Fees & Allocations:</strong> 2% minted supply dev allocation, 2%
                transfer tax dev fee, and 5% ETH fee removed.
              </li>
              <li>
                <strong>Referral Subsystem:</strong> Referral codes and storage removed.
              </li>
              <li>
                <strong>Cross-Chain Hooks:</strong> <code>bridgeMint</code> /{' '}
                <code>migrationContract</code> removed.
              </li>
              <li>
                <strong>Synchronous DEX Interactions:</strong> In-line swaps removed from transfers.
              </li>
            </ol>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.35rem' }}>
              Added Components in NXDv3:
            </h4>
            <ol
              style={{
                paddingLeft: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                listStyleType: 'decimal',
              }}
            >
              <li>
                <strong>Asynchronous Processors:</strong> <code>processTax()</code> &{' '}
                <code>processRewards()</code>.
              </li>
              <li>
                <strong>Tiered Deposit Curve:</strong> 3-tier supply rate engine.
              </li>
              <li>
                <strong>XEN Ecosystem Integration:</strong> 15% ETH protocol rewards to XEN (dev
                fee).
              </li>
              <li>
                <strong>O(1) Staking Algorithm:</strong> Scalable single-pool staking with{' '}
                <code>unallocatedRewards</code> & emergency fee redistribution.
              </li>
              <li>
                <strong>Two-Step Governance:</strong> Transfer & accept governance pattern.
              </li>
              <li>
                <strong>Slippage Controls:</strong> Parameterized across Uniswap V2 & V3.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
