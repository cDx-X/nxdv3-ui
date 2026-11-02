import React from 'react';
import { MermaidDiagram } from './MermaidDiagram';

const taxPipelineChart = `flowchart TB
    classDef contract fill:#1E293B,stroke:#38BDF8,stroke-width:2px,color:#F8FAFC;
    classDef dex fill:#0F172A,stroke:#F59E0B,stroke-width:2px,color:#F8FAFC;
    classDef burn fill:#450A0A,stroke:#EF4444,stroke-width:2px,color:#FCA5A5;
    classDef external fill:#14532D,stroke:#22C55E,stroke-width:2px,color:#DCFCE7;
    classDef user fill:#312E81,stroke:#818CF8,stroke-width:2px,color:#EEF2FF;

    Transfer(["NXD Transfer (e.g., 100 NXD)"]):::user
    Recipient(["Transfer Recipient (95 NXD)"]):::user
    BurnZero[["address(0)\nPermanent Burn (1.5 NXD)"]]:::burn

    TaxRecipient["TaxRecipientV3\n(Receives 3.5 NXD)"]:::contract
    UniV2["Uniswap V2 Router\n(Swap 4/7 NXD to DXN)"]:::dex
    DBXen(("DBXen Protocol\nStaked via depositNoMint")):::external
    UniV2LP["Uniswap V2 LP Pairing\n(3/7 NXD + 75% DXN)"]:::dex
    LockedLP(("Locked in TaxRecipientV3\n(Protocol-Owned Liquidity)")):::dex

    Transfer -- "95% (95 NXD)" --> Recipient
    Transfer -- "30% of Tax (1.5 NXD)" --> BurnZero
    Transfer -- "70% of Tax (3.5 NXD)" --> TaxRecipient

    TaxRecipient -- "4/7 (2.0 NXD)" --> UniV2
    UniV2 -- "25% of DXN (0.5 NXD equiv.)" --> DBXen
    UniV2 -- "75% of DXN (1.5 NXD equiv.)" --> UniV2LP
    TaxRecipient -- "3/7 remaining NXD (1.5 NXD)" --> UniV2LP
    UniV2LP -- "Mint LP Tokens" --> LockedLP`;

const rewardsPipelineChart = `flowchart TB
    classDef contract fill:#1E293B,stroke:#38BDF8,stroke-width:2px,color:#F8FAFC;
    classDef dex fill:#0F172A,stroke:#F59E0B,stroke-width:2px,color:#F8FAFC;
    classDef burn fill:#450A0A,stroke:#EF4444,stroke-width:2px,color:#FCA5A5;
    classDef external fill:#14532D,stroke:#22C55E,stroke-width:2px,color:#DCFCE7;
    classDef user fill:#312E81,stroke:#818CF8,stroke-width:2px,color:#EEF2FF;

    DBXen(("DBXen Fees
(Harvested ETH)")):::external
    Protocol["NXDv3Protocol
(Core Coordinator)"]:::contract

    UniV3_DXN["Uniswap V3
(ETH -> DXN Swap)"]:::dex
    UniV3_XEN["Uniswap V3
(ETH -> XEN Swap)"]:::dex
    UniV2_NXD["Uniswap V2
(DXN -> NXD Swap)"]:::dex

    BurnDXN[["0x...dEaD
Burn DXN (10%)"]]:::burn
    BurnNXD[["address(0)
Burn NXD (55% DXN equivalent)"]]:::burn
    DBXenStake(("DBXen Protocol
Stake DXN (35%)")):::external

    Vault["NXDv3StakingVault
(Dual-Reward Streaming Engine)"]:::contract
    Stakers(["NXD Stakers"]):::user

    DBXen --> Protocol

    Protocol -- "70% ETH" --> UniV3_DXN
    UniV3_DXN -- "10% DXN" --> BurnDXN
    UniV3_DXN -- "35% DXN" --> DBXenStake
    UniV3_DXN -- "55% DXN" --> UniV2_NXD
    UniV2_NXD -- "Output NXD" --> BurnNXD

    Protocol -- "15% ETH" --> Vault
    Protocol -- "15% ETH" --> UniV3_XEN
    UniV3_XEN -- "Output XEN" --> Vault

    Vault -- "7-Day Linear ETH Stream" --> Stakers
    Vault -- "7-Day Linear XEN Stream" --> Stakers`;

export const AuditPart2: React.FC = () => {
  return (
    <div className="audit-section-stack">
      <div>
        <h3>2. System Architecture & Contract Deep-Dive</h3>

        <div className="audit-section-stack">
          {/* Section A: NXDv3ERC20.sol */}
          <div>
            <h4>A. Token Core: NXDv3ERC20.sol</h4>

            <div style={{ marginBottom: '1rem' }}>
              <h5>
                Transfer Tax Mechanism (<code>_update</code>)
              </h5>
              <ul>
                <li>
                  <strong>Rate</strong>: 5% (<code>amount / 20</code>) evaluated in{' '}
                  <code>getAmountsAfterTax</code>.
                  <br />
                  <strong>Exemptions</strong>:
                  <ul>
                    <li>
                      Excluded when sender (<code>isExcludedWhenSender == true</code>): The
                      Protocol, the TaxRecipientV3 contract, the token contract itself, and the
                      Uniswap V2 Pair (for token purchases).
                    </li>
                    <li>
                      Excluded when recipient (<code>isExcludedWhenRecipient == true</code>):
                      Protocol, TaxRecipientV3, and the token contract.
                    </li>
                    <li>
                      Transfers to <code>address(0)</code> or <code>DEAD_ADDRESS</code> (
                      <code>0x...dEaD</code>).
                    </li>
                  </ul>
                </li>
              </ul>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h5>Immediate Tax Routing</h5>
              <p>When a transfer incurs tax:</p>
              <ul>
                <li>
                  <strong>30% of the tax (1.5% of total transfer)</strong> is immediately burned to{' '}
                  <code>address(0)</code> via <code>_recordBurn</code>.
                </li>
                <li>
                  <strong>70% of the tax (3.5% of total transfer)</strong> is transferred directly
                  to <code>TaxRecipientV3</code>.
                </li>
                <li>
                  The recipient receives the remaining <strong>95%</strong> of the transfer amount.
                </li>
              </ul>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h5>Dead-Address Redirection</h5>
              <p>
                Transfers targeting <code>0x000000000000000000000000000000000000dEaD</code> are
                redirected to <code>address(0)</code> and registered in the internal burn tracker.
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h5>Initial Timestamp (T0)</h5>
              <p>Initialized on the first burn event and aligned to midnight UTC:</p>
              <p className="audit-formula">
                firstBurnTimestamp = (block.timestamp / 1 day) * 1 day
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h5>Epoch Calculation</h5>
              <p className="audit-formula">
                currentEpoch = (block.timestamp - firstBurnTimestamp) / 7 days
              </p>
              <ul>
                <li>
                  <strong>Complexity</strong>: O(1) on-chain state updates. Every burn updates{' '}
                  <code>epochBurned[epoch]</code> and <code>totalNXDBurned</code>.
                </li>
                <li>
                  <strong>Frontend Views</strong>:{' '}
                  <code>getEpochsBurnData(fromEpoch, toEpoch)</code> and{' '}
                  <code>getAllEpochsBurnData()</code> return bounded historical epoch data without
                  gas-exhaustion risks.
                </li>
              </ul>
            </div>
          </div>
          {/* Section B: TaxRecipientV3.sol */}
          <div>
            <h4>B. Tax Processor: TaxRecipientV3.sol</h4>
            <ul>
              <li>
                <strong>
                  Tax Buffer & LP Provisioning (<code>_processTaxInternal</code>)
                </strong>
                :
                <ul>
                  <li>
                    <strong>Step 1 (DXN Staking)</strong>: 25% of accumulated DXN is approved and
                    sent to <code>NXDv3Protocol.depositNoMint(dxnToStake)</code>, automatically
                    staking it into DBXen without minting new NXD.
                  </li>
                  <li>
                    <strong>Step 2 (Optimal Ratio LP Minting)</strong>:
                    <ul>
                      <li>
                        Queries the current Uniswap V2 reserves (<code>reserveNXD</code>,{' '}
                        <code>reserveDXN</code>).
                      </li>
                      <li>
                        Calculates{' '}
                        <code>optimalDXN = (ourNXDBalance * reserveDXN) / reserveNXD</code>.
                      </li>
                      <li>
                        If <code>optimalDXN &lt;= ourDXNBalance</code>, it uses 100% of available
                        NXD and matches it with exact proportional DXN.
                      </li>
                      <li>
                        If not, it uses 100% of available DXN and matches it with exact proportional
                        NXD (<code>optimalDXN</code>).
                      </li>
                      <li>
                        Calls <code>UNISWAP_V2_ROUTER.addLiquidity(...)</code> with minimum output
                        checks (<code>slippageBps</code>).
                      </li>
                      <li>
                        LP tokens remain locked in the contract. Leftover dust tokens remain safe in
                        the contract for the next cycle.
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </div>

          <MermaidDiagram chart={taxPipelineChart} title="Detailed 5% Tax Pipeline" />

          {/* Section C: NXDv3Protocol.sol */}
          <div>
            <h4>C. Protocol Coordinator: NXDv3Protocol.sol</h4>
            <ul>
              <li>
                <strong>
                  Tiered Minting Engine (<code>deposit</code> / <code>_calculateDepositOutput</code>
                  )
                </strong>
                :
                <ul>
                  <li>
                    <strong>Deposit Ceiling</strong>: Protocol-wide deposit minting supply (
                    <code>MINTABLE_SUPPLY_FOR_DEPOSIT = maxSupply - initialSupply</code>, up to
                    120,000 NXD). No artificial per-wallet limit; excess DXN is never consumed.
                  </li>
                  <li>
                    <strong>Tiered Pricing</strong>:
                    <p style={{ marginTop: '0.2rem', marginBottom: '0.2rem' }}>
                      Priced across 3 equal tiers (
                      <code>TIER_SIZE = MINTABLE_SUPPLY_FOR_DEPOSIT / 3</code>):
                    </p>
                    <ul>
                      <li>
                        <strong>Tier 1 (First 1/3 of deposit supply)</strong>: 1 DXN → 1.000 NXD
                        (1:1 / <code>BASE_DEPOSIT_RATE</code>)
                      </li>
                      <li>
                        <strong>Tier 2 (Second 1/3 of deposit supply)</strong>: 1 DXN → 0.909 NXD
                        (10/11)
                      </li>
                      <li>
                        <strong>Tier 3 (Final 1/3 of deposit supply)</strong>: 1 DXN → 0.826 NXD
                        (100/121)
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
                  Reward Distribution Engine (<code>processRewards</code> /{' '}
                  <code>_handleRewards</code>)
                </strong>
                :
                <p style={{ marginTop: '0.25rem' }}>
                  When ETH rewards accumulate in the protocol from DBXen fee claims:
                </p>
                <ol>
                  <li>
                    <strong>70% ETH</strong>: Swapped for DXN on Uniswap V3 (TWAP checked via{' '}
                    <code>v3Oracle.getHumanQuote</code>):
                    <ul>
                      <li>
                        <strong>10%</strong> of received DXN → Sent to <code>0xDeaDbeef...</code>{' '}
                        (burned).
                      </li>
                      <li>
                        <strong>35%</strong> of received DXN → Added to{' '}
                        <code>pendingDXNToStake</code> and immediately staked in DBXen (
                        <code>stakeOurDXN</code>).
                      </li>
                      <li>
                        <strong>55%</strong> of received DXN → Swapped for NXD on Uniswap V2 and
                        burned (<code>nxd.burn</code>).
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>15% ETH</strong>: Sent to <code>NXDv3StakingVault</code> for NXD
                    stakers.
                  </li>
                  <li>
                    <strong>15% ETH</strong>: Swapped for XEN on Uniswap V3 (TWAP checked) and sent
                    to <code>Staking Vault</code>.
                  </li>
                </ol>
              </li>
            </ul>
          </div>
          {/* Section D: NXDv3StakingVault.sol */}
          <div>
            <h4>D. Staking Vault: NXDv3StakingVault.sol</h4>
            <ul>
              <li>
                <strong>Dual-Reward Continuous Linear Streaming Engine (Synthetix-Style)</strong>:
                <p style={{ marginTop: '0.25rem' }}>
                  Distributes dual rewards (<strong>ETH</strong> and <strong>XEN</strong>) over
                  rolling 7-day cycles (<code>REWARD_DURATION = 7 days</code>) using continuous
                  emission rates (<code>rewardRateETH</code>, <code>rewardRateXEN</code>)
                  synchronized with high-precision share indices (<code>accEthPerShare</code>,{' '}
                  <code>accXenPerShare</code> with <code>PRECISION = 1e18</code>). Guarantees
                  constant O(1) gas cost regardless of total stakers.
                </p>
              </li>
              <li>
                <strong>
                  Zero-Staker Buffer Protection (<code>unallocatedRewardsETH</code> &{' '}
                  <code>unallocatedRewardsXEN</code>)
                </strong>
                :
                <ul>
                  <li>
                    If ETH or XEN rewards arrive while <code>totalStaked == 0</code>, the incoming
                    assets are captured in <code>unallocatedRewardsETH</code> and{' '}
                    <code>unallocatedRewardsXEN</code>.
                  </li>
                  <li>
                    As soon as active staking begins or resumes, buffered rewards are automatically
                    rolled into the next 7-day streaming cycle, eliminating any locked, stuck, or
                    diluted rewards.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Independent Reward Claiming</strong>:
                <p style={{ marginTop: '0.25rem' }}>
                  Stakers can claim rewards independently via <code>claimRewards()</code> (both ETH
                  & XEN), <code>claimETH()</code>, or <code>claimXEN()</code>, or route payouts to
                  any external recipient address via <code>claimRewardsTo</code>,{' '}
                  <code>claimETHTo</code>, and <code>claimXENTo</code>.
                </p>
              </li>
              <li>
                <strong>Withdrawals & 24h Cooldown Management</strong>:
                <ul>
                  <li>
                    <strong>
                      Instant with Penalty (<code>acceptsPenalty = true</code>)
                    </strong>
                    : User receives 75% of requested NXD; 25% is burned physically to permanently
                    decrement supply (<code>nxdPenaltyBurned</code>).
                  </li>
                  <li>
                    <strong>
                      Standard Cooldown (<code>acceptsPenalty = false</code>)
                    </strong>
                    : Queues withdrawal with <code>WITHDRAWAL_COOLDOWN = 1 days</code> via{' '}
                    <code>withdrawalRequests[msg.sender]</code>. Staked balance is deducted
                    immediately upon scheduling, and tokens are safely collected after 24 hours via{' '}
                    <code>withdrawCooldown()</code>.
                  </li>
                  <li>
                    Guard against concurrent cooldown abuse: only one withdrawal request can be
                    pending at a time (<code>revert Cooldown()</code>).
                  </li>
                </ul>
              </li>
              <li>
                <strong>
                  In-Place Freezing Emergency Mode (<code>emergencyWithdraw</code>)
                </strong>
                :
                <p style={{ marginTop: '0.25rem' }}>
                  Governance-activated safeguard. When enabled (
                  <code>emergencyWithdrawEnabled = true</code>), active reward emission streams are
                  safely paused (<code>_pauseEthStream</code>, <code>_pauseXenStream</code>) locking
                  unallocated rewards in the contract. Users can exit immediately with{' '}
                  <strong>
                    100% of their principal (both staked NXD and any pending cooldown requests) with
                    ZERO penalty
                  </strong>
                  , while simultaneously receiving all accrued ETH and XEN rewards.
                </p>
              </li>
            </ul>
          </div>
        </div>

        <MermaidDiagram chart={rewardsPipelineChart} title="Detailed Rewards Engine Pipeline" />
      </div>
    </div>
  );
};
