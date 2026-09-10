import React from 'react';

export const AuditPart3: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.35rem' }}>
          D. [NXDv3StakingVault.sol]
        </h4>
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
            <strong>Discrete Index Reward Algorithm</strong>:
            <p style={{ marginTop: '0.25rem' }}>
              Utilizes <code>accEthPerShare</code> with 18 decimal precision (
              <code>PRECISION = 1e18</code>), guaranteeing constant gas cost regardless of total
              stakers.
            </p>
          </li>
          <li>
            <strong>
              Zero-Staker Buffer Protection (<code>unallocatedRewards</code>)
            </strong>
            :
            <ul
              style={{
                paddingLeft: '1.25rem',
                marginTop: '0.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                listStyleType: 'circle',
              }}
            >
              <li>
                If ETH rewards arrive while <code>totalStaked == 0</code>, the ETH is captured in{' '}
                <code>unallocatedRewards</code>.
              </li>
              <li>
                As soon as a staker enters or active stake exists, <code>unallocatedRewards</code>{' '}
                is credited into <code>accEthPerShare</code> or <code>user.accruedETH</code>,
                preventing any stuck or lost ETH.
              </li>
            </ul>
          </li>
          <li>
            <strong>Withdrawals & 24h Cooldown Management</strong>:
            <ul
              style={{
                paddingLeft: '1.25rem',
                marginTop: '0.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                listStyleType: 'circle',
              }}
            >
              <li>
                <strong>
                  Instant with Penalty (<code>acceptsPenalty = true</code>)
                </strong>
                : User receives 75% of requested NXD; 25% is burned immediately (
                <code>nxdPenaltyBurned</code>).
              </li>
              <li>
                <strong>
                  Standard Cooldown (<code>acceptsPenalty = false</code>)
                </strong>
                : Schedules a withdrawal with <code>WITHDRAWAL_COOLDOWN = 1 days</code>.
              </li>
              <li>
                Stakers continue earning ETH rewards on their full staked balance during the 24h
                cooldown period until finalized via <code>withdrawCooldown</code> or{' '}
                <code>withdraw</code>.
              </li>
              <li>
                Over-withdrawal protection: strictly verifies{' '}
                <code>user.amount &gt;= pendingAmount + _amount + lockedInCooldown</code>.
              </li>
            </ul>
          </li>
          <li>
            <strong>Emergency Withdraw</strong>:
            <p style={{ marginTop: '0.25rem' }}>
              Governance-enabled safeguard. Users can retrieve 100% of their staked NXD while
              forfeiting their pending ETH rewards back into the vault for remaining stakers.
            </p>
          </li>
        </ul>
      </div>

      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--accent-gold)', fontSize: '1.05rem' }}
        >
          2. Security & Vulnerability Assessment
        </h3>
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
                <th style={{ padding: '8px' }}>Category</th>
                <th style={{ padding: '8px' }}>Status</th>
                <th style={{ padding: '8px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px', fontWeight: 500 }}>Reentrancy Protection</td>
                <td style={{ padding: '8px', color: '#10b981', fontWeight: 600 }}>PASSED</td>
                <td style={{ padding: '8px' }}>
                  Guarded by OpenZeppelin's ReentrancyGuard in NXDv3Protocol, custom lock modifier
                  in NXDv3StakingVault, and lockTaxProcessing in NXDv3ERC20. Follows
                  Checks-Effects-Interactions.
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px', fontWeight: 500 }}>DEX Router Deadlocks</td>
                <td style={{ padding: '8px', color: '#10b981', fontWeight: 600 }}>PASSED</td>
                <td style={{ padding: '8px' }}>
                  No DEX swaps execute during standard ERC-20 transfers.
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px', fontWeight: 500 }}>Front-running / Sandwich (MEV)</td>
                <td style={{ padding: '8px', color: '#10b981', fontWeight: 600 }}>PASSED</td>
                <td style={{ padding: '8px' }}>
                  Swaps on V2 and V3 verify minimum outputs (amountOutMin) using on-chain TWAP
                  oracles with bounded slippage parameters.
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px', fontWeight: 500 }}>Arithmetic Safety</td>
                <td style={{ padding: '8px', color: '#10b981', fontWeight: 600 }}>PASSED</td>
                <td style={{ padding: '8px' }}>
                  Built with solidity ^0.8.20 featuring native overflow/underflow reverts.
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 500 }}>Token Allowances</td>
                <td style={{ padding: '8px', color: '#10b981', fontWeight: 600 }}>PASSED</td>
                <td style={{ padding: '8px' }}>
                  Uses SafeERC20 with forceApprove to prevent non-standard approval errors with
                  Uniswap routers.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
