import React from 'react';

export const WhyPart2: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}
        >
          2. Token Contract: <code>NXDERC20</code> vs. <code>NXDv3ERC20</code>
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
              <strong>Decoupled Tax:</strong> v3 credits <code>address(this)</code> with tax in{' '}
              <code>_update()</code>; swaps/LP via <code>processTax()</code> (reentrancy guarded).
            </li>
            <li>
              <strong>Tokenomics & Dev:</strong> Removed 2% of minted supply NXD dev allocation & 1%
              dev transfer fee. All non-DXN/LP tax is burned.
            </li>
            <li>
              <strong>Governance:</strong> Secure two-step <code>transferGovernance()</code> /{' '}
              <code>acceptGovernance()</code>.
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
                <th style={{ padding: '10px' }}>Feature / Variable</th>
                <th style={{ padding: '10px' }}>NXD (v2)</th>
                <th style={{ padding: '10px' }}>
                  NXDv3 (<code>NXDv3ERC20</code>)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Name / Symbol
                </td>
                <td style={{ padding: '10px' }}>
                  <code>"NXD Token V2"</code> / <code>"NXDv2"</code>
                </td>
                <td style={{ padding: '10px' }}>
                  <code>"opNXDv3"</code> / <code>"opNXDv3"</code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Max Rewards Supply
                </td>
                <td style={{ padding: '10px' }}>
                  <code>730_000</code>
                </td>
                <td style={{ padding: '10px' }}>
                  <code>120_000</code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Dev Allocation
                </td>
                <td style={{ padding: '10px' }}>
                  <code>2% minted supply</code>
                </td>
                <td style={{ padding: '10px', color: '#10b981', fontWeight: 600 }}>Removed (0)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Burn Mechanism
                </td>
                <td style={{ padding: '10px' }}>Transfer to dead address</td>
                <td style={{ padding: '10px' }}>
                  OpenZeppelin <code>_burn()</code> + public <code>burn(uint256)</code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Sell Tax Breakdown
                </td>
                <td style={{ padding: '10px' }}>40% DXN, 30% DEADBEEF, 20% dev, 10% LP</td>
                <td style={{ padding: '10px' }}>
                  40% DXN, 30% Burn, 30% LP <em>(0% dev)</em>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Slippage Protection
                </td>
                <td style={{ padding: '10px' }}>Hardcoded 3%</td>
                <td style={{ padding: '10px' }}>
                  Configurable <code>slippageBpsERC20</code> (default 5%)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Router Upgradability
                </td>
                <td style={{ padding: '10px' }}>Immutable</td>
                <td style={{ padding: '10px' }}>
                  Added <code>setRouter(address)</code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Epoch / Analytics
                </td>
                <td style={{ padding: '10px' }}>Block-based</td>
                <td style={{ padding: '10px' }}>Timestamp-based (7-day epochs)</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Governance
                </td>
                <td style={{ padding: '10px' }}>1-step</td>
                <td style={{ padding: '10px' }}>2-step (transfer + accept)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
