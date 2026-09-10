import React from 'react';

export const WhyPart3: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}
        >
          3. Protocol Orchestrator: <code>NXDProtocol</code> vs. <code>NXDv3Protocol</code>
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
              <strong>Minting Model:</strong> Replaced time-decaying CSP with a 3-tier supply-based
              bonding curve.
            </li>
            <li>
              <strong>Removed Legacy Subsystems:</strong> Stripped out referral codes, team vesting
              contract (`Vesting.sol`), dev fee shares, and cross-chain migration/bridge hooks.
            </li>
            <li>
              <strong>Reward Distribution:</strong> Buffers incoming ETH and executes trades via
              explicit `processRewards()` call.
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
                <th style={{ padding: '10px' }}>Feature / Mechanism</th>
                <th style={{ padding: '10px' }}>NXD (v2)</th>
                <th style={{ padding: '10px' }}>
                  NXDv3 (<code>NXDv3Protocol</code>)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Deposit / Minting Logic
                </td>
                <td style={{ padding: '10px' }}>Time-Based CSP (14-day linear rate decay)</td>
                <td style={{ padding: '10px' }}>
                  3-tier supply-based bonding curve (Tier 1: 1.0, Tier 2: ~0.909, Tier 3: ~0.826)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Referral Program
                </td>
                <td style={{ padding: '10px' }}>Full referral subsystem & bonus tracking</td>
                <td style={{ padding: '10px', color: '#10b981', fontWeight: 600 }}>
                  Completely Removed
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Team Vesting & Dev
                </td>
                <td style={{ padding: '10px' }}>
                  <code>Vesting.sol</code> + 5% ETH dev fee
                </td>
                <td style={{ padding: '10px', color: '#10b981', fontWeight: 600 }}>
                  Completely Removed (0% dev cut)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  ETH Fee Split
                </td>
                <td style={{ padding: '10px' }}>
                  5% dev, 50% NXD burn, 30% DXN stake, 15% NXD vault, 5% DXN burn
                </td>
                <td style={{ padding: '10px' }}>
                  70% DXN (10% burn, 35% stake, 55% NXD burn), 15% NXD Vault, 15% XEN
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  DXN Staking
                </td>
                <td style={{ padding: '10px' }}>Queued into `pendingDXNToStake`</td>
                <td style={{ padding: '10px' }}>Instantly stakes purchased DXN</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Liquidity Provisioning
                </td>
                <td style={{ padding: '10px' }}>Retained token dust</td>
                <td style={{ padding: '10px' }}>Refunds leftover nxd/dxn to sender</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Security & Slippage
                </td>
                <td style={{ padding: '10px' }}>Hardcoded 3% slippage</td>
                <td style={{ padding: '10px' }}>
                  Configurable slippage (default 5%), ReentrancyGuard, SafeERC20
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
