import React from 'react';

export const AuditPart2: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.35rem' }}>
          B. [TaxRecipientV3.sol]
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
              Tax Buffer & LP Provisioning (<code>_processTaxInternal</code>)
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
                <strong>Step 1 (DXN Staking)</strong>: 25% of accumulated DXN is approved and sent
                to <code>NXDv3Protocol.depositNoMint(dxnToStake)</code>, automatically staking it
                into DBXen without minting new NXD.
              </li>
              <li>
                <strong>Step 2 (Optimal Ratio LP Minting)</strong>:
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
                    Queries the current Uniswap V2 reserves (<code>reserveNXD</code>,{' '}
                    <code>reserveDXN</code>).
                  </li>
                  <li>
                    Calculates <code>optimalDXN = (ourNXDBalance * reserveDXN) / reserveNXD</code>.
                  </li>
                  <li>
                    If <code>optimalDXN &lt;= ourDXNBalance</code>, it uses 100% of available NXD
                    and matches it with exact proportional DXN.
                  </li>
                  <li>
                    If not, it uses 100% of available DXN and matches it with exact proportional NXD
                    (<code>optimalDXN</code>).
                  </li>
                  <li>
                    Calls <code>UNISWAP_V2_ROUTER.addLiquidity(...)</code> with minimum output
                    checks (<code>slippageBps</code>).
                  </li>
                  <li>
                    Safely transfers all newly minted LP tokens to <code>lpRecipient</code>.
                    Leftover dust tokens remain safe in the contract for the next cycle.
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </div>

      <div>
        <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.35rem' }}>
          C. [NXDv3Protocol.sol]
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
              Tiered Minting Engine (<code>deposit</code> / <code>_calculateDepositOutput</code>)
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
                Total mintable through deposits: <code>MINTABLE_SUPPLY_FOR_DEPOSIT = 90 ether</code>{' '}
                split into 3 tiers of <code>30 ether (90 ether - example)</code>:
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
                    <strong>Tier 1 (0 – 30 NXD)</strong>: 1 DXN → 1.000 NXD (1:1)
                  </li>
                  <li>
                    <strong>Tier 2 (30 – 60 NXD)</strong>: 1 DXN → 0.909 NXD (10/11)
                  </li>
                  <li>
                    <strong>Tier 3 (60 – 90 NXD)</strong>: 1 DXN → 0.826 NXD (100/121)
                  </li>
                </ul>
              </li>
              <li>
                Multi-tier overflow calculations are handled iteratively in{' '}
                <code>_calculateDepositOutput</code>.
              </li>
              <li>
                If a user supplies more DXN than the remaining deposit ceiling,{' '}
                <code>_calculateDxnForNxd</code> calculates the exact <code>dxnConsumed</code>,
                takes only that portion, and leaves the remaining user balance untouched.
              </li>
            </ul>
          </li>
          <li>
            <strong>
              Reward Distribution Engine (<code>processRewards</code> / <code>_handleRewards</code>)
            </strong>
            :
            <p style={{ marginTop: '0.25rem' }}>
              When ETH rewards accumulate in the protocol from DBXen fee claims:
            </p>
            <ol
              style={{
                paddingLeft: '1.25rem',
                marginTop: '0.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                listStyleType: 'decimal',
              }}
            >
              <li>
                <strong>70% ETH</strong>: Swapped for DXN on Uniswap V3 (TWAP checked via{' '}
                <code>v3Oracle.getHumanQuote</code>):
                <ul
                  style={{
                    paddingLeft: '1.25rem',
                    marginTop: '0.2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    listStyleType: 'circle',
                  }}
                >
                  <li>
                    <strong>10%</strong> of received DXN → Sent to <code>0xDeaDbeef...</code>{' '}
                    (burned).
                  </li>
                  <li>
                    <strong>35%</strong> of received DXN → Added to <code>pendingDXNToStake</code>{' '}
                    and immediately staked in DBXen (<code>stakeOurDXN</code>).
                  </li>
                  <li>
                    <strong>55%</strong> of received DXN → Swapped for NXD on Uniswap V2 and burned
                    (<code>nxd.burn</code>).
                  </li>
                </ul>
              </li>
              <li>
                <strong>15% ETH</strong>: Sent to <code>NXDv3StakingVault</code> for NXD stakers.
              </li>
              <li>
                <strong>15% ETH</strong>: Swapped for XEN on Uniswap V3 (TWAP checked) and sent to{' '}
                <code>Staking Vault</code>.
              </li>
            </ol>
          </li>
        </ul>
      </div>
    </div>
  );
};
