import React from 'react';

export const AuditPart4: React.FC = () => {
  return (
    <div className="audit-section-stack">
      <div>
        <h3>
          4. Security & Vulnerability Analysis
        </h3>
        <div className="doc-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Vulnerability Category</th>
                <th>Status</th>
                <th>Evaluation & Mitigation Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Reentrancy Attacks</td>
                <td className="audit-status">SECURED</td>
                <td>
                  OpenZeppelin's ReentrancyGuard protects NXDv3Protocol. Reentrancy locks (lock,
                  lockTaxProcessing) protect NXDv3StakingVault, TaxRecipientV3, and NXDv3ERC20. All
                  state modifications strictly precede external interactions
                  (Checks-Effects-Interactions pattern).
                </td>
              </tr>
              <tr>
                <td>Transfer Deadlocks & Gas Exhaustion</td>
                <td className="audit-status">SECURED</td>
                <td>
                  The ERC-20 _update implementation is entirely decoupled from external DEX calls.
                  User-to-user transfers cannot fail due to AMM pool imbalance, price impact
                  violations, or router gas exhaustion.
                </td>
              </tr>
              <tr>
                <td>MEV / Sandwich Exploitation</td>
                <td className="audit-status">SECURED</td>
                <td>
                  Uniswap V3 operations use 10-minute TWAP queries (<code>MIN_SECONDS_AGO = 600</code>, <code>v3Oracle.getHumanQuote</code>). Uniswap
                  V2 swaps query 30-minute cumulative time-weighted reserves (<code>PERIOD = 30 minutes</code>, <code>v2Oracle.consult</code>). Swaps enforce
                  minimum output thresholds parameterized by governance-controlled slippage tolerances (<code>slippageBps</code>).
                </td>
              </tr>
              <tr>
                <td>L2 Sequencer Downtime & Stale Prices</td>
                <td className="audit-status">SECURED</td>
                <td>
                  Both V2Oracle and V3Oracle integrate Chainlink's L2 Sequencer Uptime Feed with a mandatory 1-hour grace period (<code>GRACE_PERIOD_TIME = 3600s</code>) after any sequencer restart, preventing trades at stale prices before arbitrageurs rebalance pools. V2Oracle additionally enforces a 2-hour maximum price age limit (<code>MAX_AGE = 2 hours</code>).
                </td>
              </tr>
              <tr>
                <td>Rounding & Precision Losses</td>
                <td className="audit-status">SECURED</td>
                <td>
                  The staking vault operates at 18 decimals (PRECISION = 1e18). Fractional rewards
                  unallocated due to integer division are credited back to unallocatedRewardsETH and
                  unallocatedRewardsXEN.
                </td>
              </tr>
              <tr>
                <td>Privileged Access Abuse</td>
                <td className="audit-status">SECURED</td>
                <td>
                  Two-step governance prevents misconfiguration. The contract provides no
                  administrative functions capable of draining user stakes or diverting unallocated
                  rewards.
                </td>
              </tr>
              <tr>
                <td>DoS via Rejecting Recipients</td>
                <td className="audit-status">SECURED</td>
                <td>
                  NXDv3StakingVault encapsulates transfers in _safeETHTransfer and
                  _safeTokenTransfer. Failing recipient contracts do not revert the execution
                  transaction; instead, unspent reward balances are preserved.
                </td>
              </tr>
              <tr>
                <td>Pair Token Ordering Ambiguity</td>
                <td className="audit-status">SECURED</td>
                <td>
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

