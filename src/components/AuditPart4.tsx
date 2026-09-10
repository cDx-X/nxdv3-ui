import React from 'react';

export const AuditPart4: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--accent-gold)', fontSize: '1.05rem' }}
        >
          4. Security & Vulnerability Analysis
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
                <th style={{ padding: '8px' }}>Vulnerability Category</th>
                <th style={{ padding: '8px' }}>Status</th>
                <th style={{ padding: '8px' }}>Evaluation & Mitigation Details</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px', fontWeight: 500 }}>Reentrancy Attacks</td>
                <td style={{ padding: '8px', color: '#10b981', fontWeight: 600 }}>SECURED</td>
                <td style={{ padding: '8px' }}>
                  OpenZeppelin's ReentrancyGuard protects NXDv3Protocol. Reentrancy locks (lock,
                  lockTaxProcessing) protect NXDv3StakingVault, TaxRecipientV3, and NXDv3ERC20. All
                  state modifications strictly precede external interactions
                  (Checks-Effects-Interactions pattern).
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px', fontWeight: 500 }}>Transfer Deadlocks & Gas Exhaustion</td>
                <td style={{ padding: '8px', color: '#10b981', fontWeight: 600 }}>SECURED</td>
                <td style={{ padding: '8px' }}>
                  The ERC-20 _update implementation is entirely decoupled from external DEX calls.
                  User-to-user transfers cannot fail due to AMM pool imbalance, price impact
                  violations, or router gas exhaustion.
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px', fontWeight: 500 }}>MEV / Sandwich Exploitation</td>
                <td style={{ padding: '8px', color: '#10b981', fontWeight: 600 }}>SECURED</td>
                <td style={{ padding: '8px' }}>
                  Uniswap V3 operations use 5-minute TWAP queries (v3Oracle.getHumanQuote). Uniswap
                  V2 swaps query cumulative time-weighted reserves (v2Oracle.consult). Swaps enforce
                  minimum output thresholds parameterized by governance-controlled slippage tolerances.
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px', fontWeight: 500 }}>Rounding & Precision Losses</td>
                <td style={{ padding: '8px', color: '#10b981', fontWeight: 600 }}>SECURED</td>
                <td style={{ padding: '8px' }}>
                  The staking vault operates at 18 decimals (PRECISION = 1e18). Fractional rewards
                  unallocated due to integer division are credited back to unallocatedRewardsETH and
                  unallocatedRewardsXEN.
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px', fontWeight: 500 }}>Privileged Access Abuse</td>
                <td style={{ padding: '8px', color: '#10b981', fontWeight: 600 }}>SECURED</td>
                <td style={{ padding: '8px' }}>
                  Two-step governance prevents misconfiguration. The contract provides no
                  administrative functions capable of draining user stakes or diverting unallocated
                  rewards.
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px', fontWeight: 500 }}>DoS via Rejecting Recipients</td>
                <td style={{ padding: '8px', color: '#10b981', fontWeight: 600 }}>SECURED</td>
                <td style={{ padding: '8px' }}>
                  NXDv3StakingVault encapsulates transfers in _safeETHTransfer and
                  _safeTokenTransfer. Failing recipient contracts do not revert the execution
                  transaction; instead, unspent reward balances are preserved.
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 500 }}>Pair Token Ordering Ambiguity</td>
                <td style={{ padding: '8px', color: '#10b981', fontWeight: 600 }}>SECURED</td>
                <td style={{ padding: '8px' }}>
                  NXDv3Protocol asserts uint160(tokenAddress) &lt; uint160(address(dxn)) during
                  CREATE2 initialization, ensuring canonical ordering (token0 = NXD, token1 = DXN)
                  across the Uniswap V2 ecosystem.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

