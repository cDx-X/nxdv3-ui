import React from 'react';

export const AuditPart1: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <p className="lead-text" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          Gemini 3.7-flash audit.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Here is the complete architectural review, mathematical verification, and security
          analysis.
        </p>
      </div>

      <div>
        <h3
          className="text-sm font-semibold mb-2"
          style={{ color: 'var(--accent-gold)', fontSize: '1.05rem' }}
        >
          Executive Summary
        </h3>
        <p>
          The logic across all four contracts (<strong>[NXDv3ERC20.sol]</strong>,{' '}
          <strong>[TaxRecipientV3.sol]</strong>, <strong>[NXDv3Protocol.sol]</strong>,{' '}
          <strong>[NXDv3StakingVault.sol]</strong>) is{' '}
          <strong>sound, mathematically correct, and well-architected</strong>.
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          The V3 architecture eliminates common DeFi pitfalls found in reflection/tax tokens by{' '}
          <strong>
            completely decoupling DEX swaps from the <code>_update</code> transfer hook
          </strong>
          . Taxes are stored directly in <code>address(this)</code> and processed asynchronously via
          dedicated functions (<code>processTax()</code> and <code>processRewards()</code>),
          preventing reentrancy vulnerabilities, gas limit exhaustion during user transfers, and
          router reverts.
        </p>
      </div>

      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--accent-gold)', fontSize: '1.05rem' }}
        >
          1. In-Depth Contract Breakdown
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.35rem' }}>
              A. [NXDv3ERC20.sol]
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
                <strong>
                  Transfer & Tax Logic (<code>_update</code> & <code>getAmountsAfterTax</code>)
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
                    The 5% fee (<code>SELL_TAX_X100 = 500</code>) is calculated without executing
                    any DEX swaps during transfers.
                  </li>
                  <li>
                    <strong>Whitelist behavior</strong>:
                    <ul
                      style={{
                        paddingLeft: '1.25rem',
                        marginTop: '0.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                        listStyleType: 'square',
                      }}
                    >
                      <li>
                        <code>protocol</code>: Excluded when sender and recipient (
                        <code>true, true</code>).
                      </li>
                      <li>
                        <code>address(this)</code> & <code>taxRecipient</code>: Excluded when sender
                        (<code>true, false</code>).
                      </li>
                      <li>
                        <code>uniswapV2Pair</code>: Excluded when sender (
                        <code>isExcludedWhenSender = true</code>).
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>Resulting tax behavior</strong>:
                    <ul
                      style={{
                        paddingLeft: '1.25rem',
                        marginTop: '0.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                        listStyleType: 'square',
                      }}
                    >
                      <li>
                        <strong>BUY on Uniswap</strong>: <code>from</code> is pair →{' '}
                        <code>isExcludedWhenSender == true</code> → <strong>0% Tax</strong>.
                      </li>
                      <li>
                        <strong>SELL on Uniswap</strong>: <code>from</code> is user, <code>to</code>{' '}
                        is pair → neither is exempt → <strong>5% Tax</strong>.
                      </li>
                      <li>
                        <strong>P2P Transfer (Wallet-to-Wallet)</strong>: neither is exempt →{' '}
                        <strong>5% Tax</strong>.
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
              <li>
                <strong>
                  Asynchronous Tax Engine (<code>processTax</code> & <code>_processTax</code>)
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
                    Operates with reentrancy protection via <code>lockTaxProcessing</code>.
                  </li>
                  <li>
                    <strong>Tax distribution</strong>:
                    <ul
                      style={{
                        paddingLeft: '1.25rem',
                        marginTop: '0.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                        listStyleType: 'square',
                      }}
                    >
                      <li>
                        <strong>40%</strong>: Swapped for DXN on Uniswap V2 (protected by{' '}
                        <code>v2Oracle</code> TWAP and <code>slippageBpsERC20</code>), sending the
                        output DXN to <code>taxRecipient</code>.
                      </li>
                      <li>
                        <strong>30%</strong>: Burned immediately via{' '}
                        <code>_burn(address(this), burnAmount)</code>.
                      </li>
                      <li>
                        <strong>30%</strong>: Transferred as NXD to <code>taxRecipient</code> for LP
                        pair balancing.
                      </li>
                    </ul>
                  </li>
                  <li>
                    Calls <code>taxRecipient.handleTax()</code> immediately after.
                  </li>
                </ul>
              </li>
              <li>
                <strong>
                  Epoch Tracking (<code>startNewEpochIfReady</code>)
                </strong>
                :
                <p style={{ marginTop: '0.25rem' }}>
                  7-day epochs (<code>EPOCH_DURATION = 7 days</code>) compute and store historical
                  burns (<code>epochBurns[epoch] = EpochBurn(...)</code>) without unbounded storage
                  risks.
                </p>
              </li>
              <li>
                <strong>2-Step Governance</strong>:
                <p style={{ marginTop: '0.25rem' }}>
                  <code>transferGovernance()</code> → <code>acceptGovernance()</code> prevents
                  accidental lockouts by ensuring the new admin address can execute transactions
                  before transfer completes.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
