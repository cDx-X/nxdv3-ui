import React from 'react';

export const WhyPart4: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}
        >
          4. Staking Vault: <code>NXDStakingVault</code> vs. <code>NXDv3StakingVault</code>
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
              <strong>Mathematical Architecture:</strong> Deprecated MasterChef looping structure
              for an O(1) discrete accumulator model (`1e18` precision).
            </li>
            <li>
              <strong>Zero-Staker Edge Case:</strong> `unallocatedRewards` buffer automatically
              assigns incoming ETH during zero-stake to the first subsequent staker.
            </li>
            <li>
              <strong>Decoupled Accounting:</strong> Segregated balances into `accruedETH` with
              explicit `claimRewards()`.
            </li>
            <li>
              <strong>Emergency Withdrawals:</strong> Forfeited unharvested rewards are dynamically
              redistributed to remaining active stakers.
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
                <th style={{ padding: '10px' }}>Feature / Logic</th>
                <th style={{ padding: '10px' }}>NXD (v2)</th>
                <th style={{ padding: '10px' }}>
                  NXDv3 (<code>NXDv3StakingVault</code>)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Accounting Model
                </td>
                <td style={{ padding: '10px' }}>
                  Multi-pool MasterChef pattern (<code>1e12</code> precision)
                </td>
                <td style={{ padding: '10px' }}>
                  Single-pool discrete reward index O(1) (<code>1e18</code> precision)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Zero-Staker Handling
                </td>
                <td style={{ padding: '10px' }}>ETH unassigned/trapped</td>
                <td style={{ padding: '10px' }}>
                  <code>unallocatedRewards</code> buffer credits first subsequent staker
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  External Calls
                </td>
                <td style={{ padding: '10px' }}>Invoked protocol callbacks</td>
                <td style={{ padding: '10px', color: '#10b981', fontWeight: 600 }}>
                  Completely decoupled
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Reward Claiming
                </td>
                <td style={{ padding: '10px' }}>Auto-claimed during staking actions</td>
                <td style={{ padding: '10px' }}>
                  Tracks realized earnings in <code>accruedETH</code> + <code>claimRewards()</code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Penalty Burn
                </td>
                <td style={{ padding: '10px' }}>
                  25% transferred to <code>DEADBEEF</code>
                </td>
                <td style={{ padding: '10px' }}>
                  25% burned via <code>INXDBurnable_Local.burn()</code>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Emergency Withdrawal
                </td>
                <td style={{ padding: '10px' }}>Forfeited rewards trapped</td>
                <td style={{ padding: '10px' }}>
                  Forfeited ETH <strong>redistributed to remaining stakers</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
