import React, { useState } from 'react';
import { X, HelpCircle, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface WhyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const markdownContent = `# Comprehensive Technical Audit & Comparison Report: NXD (v2) vs. NXDv3

This document provides a complete architectural, cryptographic, economic, and security comparison between the legacy NXD (v2) protocol and the optimized NXDv3 smart contract suite.

---

## 1. Global & Architectural Overview

| Aspect | NXD (v2) | NXDv3 |
| :--- | :--- | :--- |
| **Solidity Version** | \`^0.8.13\` (and \`>=0.8.0\` in auxiliary files) | \`^0.8.20\` uniformly across all contracts |
| **Execution Paradigm** | **Synchronous Execution**: DEX swaps, tax routing, oracle TWAP queries, and LP minting executed directly inside regular ERC-20 transfers (\`_transfer\`) and the protocol's \`receive()\` ETH hook. | **Asynchronous Execution**: Transfers and ETH receipts only route balances. Intensive DEX interactions and state updates are decoupled into permissioned/authorized processing functions (\`processTax()\`, \`processRewards()\`). |
| **MEV & Front-Running** | Highly vulnerable to sandwich attacks on everyday user transfers; unpredictable gas consumption; critical risk of Out-of-Gas DoS during transfers. | Transfers have minimal, deterministic gas costs. Complete elimination of transfer-level MEV sandwich attack vectors. |
| **Deployment & Network** | Ethereum Mainnet addresses (e.g., Mainnet WETH \`0xC02aa...\`, DXN \`0x1B08d...\`). | Configured for **Optimism (OP Mainnet)** (OP WETH \`0x4200000000000000000000000000000000000006\`, opDXN \`0x90386DA49028ef1eF18F47f0a740cAAB50782576\`, Factory \`0x0c3c...\`, Routers). |
| **Integrated Assets** | NXD, DXN, WETH. | NXD, DXN, WETH, and **XEN Token** (\`0xeB585163DEbB1E637c6D617de3bEF99347cd75c8\`). |
| **Token Determinism** | Deployed via standard \`new NXDERC20(...)\`. Address ordering against DXN was arbitrary. | Deployed deterministically via **CREATE2 with \`salt\`**, enforcing \`uint160(tokenAddress) < uint160(address(dxn))\`. Guarantees NXD is always \`token0\` in Uniswap V2 pairs for predictable routing. |

---

## 2. Token Contract: NXDERC20 vs. NXDv3ERC20

### Key Highlights
- **Decoupled Tax Flow**: In v3, regular transfers simply burn 30% of the tax (1.5% of transfer) directly to \`address(0)\` and route the remaining 70% of tax (3.5% of transfer) to \`TaxRecipientV3\`. No swaps occur inside \`_update()\`.
- **Physical Deflationary Burning**: Transfers directed to \`DEAD_ADDRESS\` (\`0x000...dEaD\`) or \`address(0)\` trigger OpenZeppelin's \`_update(..., address(0), ...)\`, permanently reducing \`totalSupply\`.
- **Analytics & Epoch Tracking**: Built-in 7-day epoch counter (\`EPOCH_PERIOD = 7 days\`) initialized at the first burn (\`firstBurnTimestamp\` aligned to midnight 00:00:00 UTC) with paginated query functions (\`getEpochsBurnData\`, \`getAllEpochsBurnData\`).
- **Two-Step Governance**: Replaced single-step ownership with a secure pending-governance handshake (\`transferGovernance\` / \`acceptGovernance\`).

### Detailed Comparison Table

| Feature / Parameter | NXD (v2) | NXDv3 (\`NXDv3ERC20\`) |
| :--- | :--- | :--- |
| **Token Name / Symbol** | \`"NXD Token V2"\` / \`"NXDv2"\` | \`"opNXDv3"\` / \`"opNXDv3"\` |
| **Max Rewards Supply** | \`730_000 ether\` | \`120_000 ether\` |
| **Developer Allocation** | 2% minted supply via \`MAX_DEV_ALLOC\` (15,000 NXD) | **Completely Removed (0%)** |
| **Transfer Tax** | 5% on sells / non-whitelisted transfers | 5% flat on non-whitelisted transfers (\`amount / 20\`) |
| **Tax Distribution** | • 40% swapped to DXN (synchronous)<br>• 30% sent to \`0xDeaDbeef...\`<br>• 20% transferred to \`devFeeTo\`<br>• 10% sent to \`TaxRecipient\` for LP | • **30% burned immediately** to \`address(0)\` (\`1.5%\` of transfer)<br>• **70% sent directly to \`TaxRecipientV3\`** (\`3.5%\` of transfer)<br>• **0% Developer fee** |
| **Tax Processing Invocation** | Executed in-line inside \`_transfer()\` | Decoupled into \`processTax()\` / \`processTax(deadline)\` guarded by \`lockTaxProcessing\` (callable by \`taxProcessor\`, \`governance\`, \`protocol\`) |
| **Burn Destination** | \`0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF\` (balance accumulation, no supply reduction) | \`address(0)\` (physically decrements \`totalSupply()\`); transfers to \`DEAD_ADDRESS\` automatically redirect to \`address(0)\` |
| **Burn Analytics** | Block-based (\`block.number\`), manual epoch rolling (\`startNewEpochIfReady()\`, 50,000 blocks) | **Timestamp-based (7-day epochs)** aligned to UTC midnight; tracks \`epochBurned[epoch]\`, \`getEpochsBurnData()\` |
| **Governance Architecture** | Single-step \`setGovernance(address)\` | **Two-step handshake**: \`transferGovernance()\` + \`acceptGovernance()\` |

---

## 3. Protocol Orchestrator: NXDProtocol vs. NXDv3Protocol

### Key Highlights
- **Deposit / Bonding Engine**: Replaced the 14-day time-decaying Capped Staking Period (CSP) with a **3-Tier Supply-Based Bonding Curve**:
  - **Tier 1** (first 1/3 of deposit supply): \`1.000\` NXD per DXN (\`BASE_DEPOSIT_RATE\`).
  - **Tier 2** (second 1/3 of deposit supply): \`10/11 ≈ 0.90909\` NXD per DXN.
  - **Tier 3** (final 1/3 of deposit supply): \`100/121 ≈ 0.82644\` NXD per DXN.
  - Includes multi-tier chunk-filling math (\`_calculateDepositOutput\` & \`_calculateDxnForNxd\`) that accurately consumes DXN across tier transitions without rounding drift.
- **Complete Elimination of Rent Extraction**: All referral bonuses, developer fee cuts, team vesting contracts (\`Vesting.sol\`), and bridge minter roles are removed.
- **Asynchronous Protocol Reward Processing**: Protocol rewards are no longer parsed inside \`receive()\`. External rewards callers (\`rewardsProcessor\` or \`governance\`) invoke \`processRewards()\` / \`processRewards(deadline)\`.
- **Ecosystem Expansion (XEN Integration)**: Protocol swaps 15% of reward ETH into XEN and streams it directly to the staking vault.

### Detailed Comparison Table

| Feature / Mechanism | NXD (v2) | NXDv3 (\`NXDv3Protocol\`) |
| :--- | :--- | :--- |
| **Minting Mechanism** | 14-Day Time-Decaying CSP (from 1:1 down to 1:0.5 NXD/DXN via \`decreasePerSecond\`) | **3-Tier Supply-Based Bonding Curve** (Tiers: 1.0, 10/11, 100/121 NXD per DXN) based strictly on \`nxdMintedViaDeposit\` |
| **Referral System** | 5% to referrer, 10% to user; custom codes; separate reward accounting | **Completely Removed** |
| **Developer Fees & Allocations** | 5% off the top of all incoming ETH + 2% total NXD dev allocation | **Completely Removed (0%)** |
| **Vesting Contract** | Deploys dedicated \`Vesting.sol\` contract | **Completely Removed** |
| **Cross-Chain / Migration** | \`migrationContract\` & \`bridgeMint()\` hooks | **Completely Removed** |
| **ETH Reward Processing Lifecycle** | Triggered synchronously inside \`receive() external payable\` | Buffer ETH in \`receive()\`; processed asynchronously via \`processRewards()\` / \`processRewards(deadline)\` |
| **ETH Reward Distribution Breakdown** | • 5% to \`devFeeTo\`<br>• 42.5% to Buy & Burn NXD (Uniswap V2)<br>• 25.5% to Buy & Stake DXN<br>• 15.0% to NXD Staking Vault (ETH)<br>• 4.25% to Buy & Burn DXN | • **70% to DXN Swap (Uniswap V3)**:<br>&nbsp;&nbsp;↳ 10% burned to \`DEAD\`<br>&nbsp;&nbsp;↳ 35% staked into DBXen (\`totalDXNStaked\`)<br>&nbsp;&nbsp;↳ 55% swapped for NXD via Uniswap V2 and **physically burned** via \`nxd.burn()\`<br>• **15% sent to NXD Staking Vault as ETH**<br>• **15% swapped to XEN (Uniswap V3)** and streamed to NXD Staking Vault |
| **Slippage Protection** | Hardcoded 3% tolerance across swaps | Configurable \`slippageBps\` (default 5% / 500 bps) verified against V3 Oracle (10-minute TWAP) & V2 Oracle (30-minute TWAP) with Chainlink L2 Sequencer Uptime Feed protection |
| **LP Creation** | Keeps dust in contract | **Refunds unused NXD and DXN balances** back to the deployer |
| **Access Control on Rewards** | Public (anyone could trigger on \`receive\`) | Restricted to \`rewardsProcessor\` and \`governance\` (\`_checkRewardsCaller()\`) |

---

## 4. Staking Vault: NXDStakingVault vs. NXDv3StakingVault

### Key Highlights
- **Dual-Reward Continuous Streaming Engine**: Completely replaces the legacy MasterChef multi-pool pattern with two independent linear streaming engines (**ETH** and **XEN**) over rolling 7-day periods (\`REWARD_DURATION = 7 days\`), using continuous emission rates (\`rewardRateETH\`, \`rewardRateXEN\`) with high precision (\`1e18\`).
- **Zero-Staker Reserve Preservation**: Incoming rewards arriving when \`totalStaked == 0\` do not dilute or lock funds; they are buffered in \`unallocatedRewardsETH\` / \`unallocatedRewardsXEN\` and automatically rolled into the next 7-day streaming cycle once staking resumes.
- **In-Place Freezing Emergency Mode**: When emergency mode is activated (\`setEmergencyWithdrawEnabled(true)\`):
  - Reward streams are paused (\`_pauseEthStream\`, \`_pauseXenStream\`), locking unallocated rewards safely in the contract.
  - Users can exit via \`emergencyWithdraw()\` with **100% of their principal (staked NXD + pending cooldown requests) with ZERO penalty**, while simultaneously receiving all accrued ETH and XEN rewards.
- **Two Withdrawal Paths**:
  1. **Instant Withdrawal with Penalty**: Burns 25% of the requested NXD via \`INXDBurnable_Local.burn()\` and delivers 75% immediately to the user.
  2. **Non-Penalized Cooldown**: Queues tokens for a 24-hour waiting period (\`WITHDRAWAL_COOLDOWN = 1 days\`), after which \`withdrawCooldown()\` delivers 100% of tokens with no penalty.
- **Autonomous Epoch Inflow Tracking**: 7-day historical epoch data mapping (\`ethInflowByEpoch\`, \`xenInflowByEpoch\`) aligned to UTC midnight for frontend analytics and charting (\`getEpochsInflowData()\`, \`getAllEpochsInflowData()\`).

### Detailed Comparison Table

| Feature / Mechanism | NXD (v2) | NXDv3 (\`NXDv3StakingVault\`) |
| :--- | :--- | :--- |
| **Reward Token Support** | Single-reward: ETH only | **Dual-reward: ETH + XEN** |
| **Reward Distribution Model** | Multi-pool MasterChef discrete accumulator (\`1e12\` precision), manual \`massUpdatePools()\` | **Continuous Linear Streaming Engine (Synthetix-style)** over 7-day cycles (\`REWARD_DURATION = 7 days\`, \`1e18\` precision) |
| **Zero-Staker Handling** | Inflow during zero-staked states caused division by zero or untracked state anomalies | Buffered in \`unallocatedRewardsETH\` / \`unallocatedRewardsXEN\`; automatically starts streams once a deposit occurs |
| **Reward Claiming Mechanics** | Forced auto-transfer during every deposit/withdraw action | Decoupled into \`claimRewards()\`, \`claimETH()\`, \`claimXEN()\`, and recipient-directed variants (\`claimRewardsTo\`, etc.) |
| **Penalty on Instant Withdraw** | 25% transferred to \`0xDeaDbeef...\` | **25% burned physically** via \`INXDBurnable_Local(nxd).burn()\` |
| **Withdrawal Cooldown** | 1 day cooldown; manual state checks | 1 day cooldown (\`WITHDRAWAL_COOLDOWN = 1 days\`) via explicit \`WithdrawalRequest\` struct and \`withdrawCooldown()\` |
| **Emergency Mode Architecture** | Basic \`emergencyWithdraw()\` forfeiting pending rewards; cannot be paused by admin | **In-Place Freezing**: Admin toggles \`setEmergencyWithdrawEnabled()\`. Streams pause; users rescue 100% principal + claim accrued rewards without penalty |
| **External Calls & Reentrancy** | Made callbacks to \`nxdProtocol.collectFees()\` and \`stakeOurDXN()\` during user updates | **Completely decoupled**. Zero protocol callbacks; protected by reentrancy guard (\`lock\`) and SafeERC20 |
| **Analytics Support** | Block-based counters (\`averageFeesPerBlockEpoch\`, etc.) | **7-day timestamp-based inflow epochs** (\`ethInflowByEpoch\`, \`xenInflowByEpoch\`, \`getEpochsInflowData\`) |

---

## 5. Tax Handler: TaxRecipient vs. TaxRecipientV3

### Key Highlights
- **Mathematical Tax Splitting**: Handles the 70% transfer tax forwarded from \`NXDv3ERC20\`:
  1. Swaps **4/7** of NXD to DXN via Uniswap V2 with TWAP oracle consultation and slippage verification.
  2. Stakes **exactly 25% of received DXN** into DBXen via \`depositNoMint\` (representing **1/7** of total tax).
  3. Balances the remaining **3/7 NXD** with the remaining **3/7 DXN** into Uniswap V2 LP via \`_addOptimalLiquidity()\`.
  4. Automatically sweeps residual DXN dust into DBXen staking every 100 tax executions (\`SWEEP_INTERVAL\`) or on demand via \`forceSweep()\`.
- **Autonomous Pair Resolution**: Reads the liquidity pair directly from the factory (\`IUniswapV2Factory(UNISWAP_V2_FACTORY).getPair(...)\`) on-chain rather than relying on mutable storage variables.
- **Oracle & Slippage Guardrails**: Guarantees slippage protection against TWAP oracle prices on both token swaps and LP additions.

### Detailed Comparison Table

| Feature / Parameter | NXD (v2) \`TaxRecipient\` | NXDv3 \`TaxRecipientV3\` |
| :--- | :--- | :--- |
| **Execution Trigger** | Synchronous call to \`handleTax()\` inside \`_transfer()\` | Asynchronous call to \`processTax()\` / \`processTax(deadline)\` |
| **Caller Authorization** | Restricted strictly to \`address(nxd)\` | Restricted to \`address(nxd)\` and \`protocol\` via \`onlyAuthorized\` |
| **Reentrancy Protection** | None | Enforced via \`lockTaxProcessing\` modifier |
| **Pair Address Source** | Hardcoded/Stored via router lookup | **Autonomously derived** from \`UNISWAP_V2_FACTORY.getPair()\` |
| **Internal Swap Allocation** | Swaps occurred in ERC20 contract; recipient only received tokens | Swaps **4/7 of its NXD balance** to DXN with V2 TWAP oracle consultation (\`v2Oracle.consult\`) |
| **DXN Staking Allocation** | Staked 75% of DXN balance; added LP with the rest | Stakes **exactly 25% of DXN received** (1/7 of total tax) into DBXen; matches remaining DXN with remaining NXD for LP |
| **LP Slippage Protection** | Hardcoded \`0, 0\` minimum amounts (critical vulnerability to sandwich attacks) | **Strictly enforced slippage bounds** based on \`slippageBps\` (default 5%) |
| **Dust Management** | Token dust was trapped indefinitely | **Automated leftover sweep** into DBXen staking every 100 executions (\`SWEEP_INTERVAL = 100\`) or via \`forceSweep()\` |

---

## 6. End-to-End Economic Flow

### 6.1 Transfer Tax Flow (5% Flat)

#### Step 1: User Transfer (100%)
- **95.0%** → Recipient
- **5.0%** → Tax Split (in \`NXDv3ERC20._update\`)

#### Step 2: Tax Distribution (5.0% of transfer)
- **30% of tax (1.5% of transfer)** → Burned to \`address(0)\` (permanent deflation)
- **70% of tax (3.5% of transfer)** → Transferred to \`TaxRecipientV3\`

#### Step 3: Asynchronous Processing via \`processTax()\`
The 3.5% sent to TaxRecipientV3 is further split:
- **4/7 of NXD (2.0% of transfer)** → Swapped to DXN via Uniswap V2
  - **25% of DXN (0.5% transfer equiv.)** → Staked into DBXen (\`depositNoMint()\`)
  - **75% of DXN (1.5% transfer equiv.)** → Added to Uniswap V2 LP (NXD/DXN pair)
  - *Note: Leftover DXN is swept to DBXen every 100 runs*

---

### 6.2 Protocol Reward Distribution Flow (Incoming ETH)

#### Step 1: ETH Receipt
- DBXen Claim Fees / Incoming ETH → \`NXDv3Protocol.receive()\` (ETH buffered)

#### Step 2: Processing via \`processRewards()\`
- Invoked by \`rewardsProcessor\` or governance

#### Step 3: ETH Distribution (100% of incoming ETH)

| Allocation | Destination | Action |
|------------|-------------|--------|
| **70% ETH** | Swap to DXN (Uniswap V3, 1% pool) | See DXN split below |
| **15% ETH** | NXDv3StakingVault | 7-day linear stream (direct ETH) |
| **15% ETH** | Swap to XEN (Uniswap V3) → NXDv3StakingVault | 7-day linear stream (XEN) |

#### Step 4: DXN Distribution (from 70% ETH swap)

| Allocation | Destination |
|------------|-------------|
| **10% of DXN** | Burned to DEAD address |
| **35% of DXN** | Staked into DBXen (\`totalDXNStaked\`) |
| **55% of DXN** | Swapped for NXD (Uniswap V2) → Burned via \`nxd.burn()\` |

#### Final Synchronization
Both streams (ETH + XEN) synchronized via \`nxdStakingVault.updateVault()\`.

---

## 7. Summary of Changes: Removed vs. Added

### Removed in NXDv3
1. **\`Vesting.sol\`**: Team token vesting contract completely removed.
2. **Developer Rent Extraction**:
   - Removed 2% total supply developer allocation (\`MAX_DEV_ALLOC\`).
   - Removed 1% transfer tax developer fee.
   - Removed 5% protocol ETH revenue cut.
3. **Referral Subsystem**: Removed all referral codes, referral bonus tracking, and related storage mappings.
4. **Cross-Chain / Bridge Code**: Removed \`migrationContract\` and \`bridgeMint()\`.
5. **Synchronous DEX Operations**: Eliminated all DEX swaps and liquidity provisioning from inside \`_transfer()\` and \`receive()\`.
6. **Block-Based Epoch Accounting**: Eliminated inaccurate \`block.number\` estimations in favor of UTC midnight timestamps.

### Added in NXDv3
1. **Asynchronous Execution Architecture**: Decoupled, slippage-protected \`processTax()\` and \`processRewards()\` methods.
2. **3-Tier Supply-Based Bonding Engine**: Deterministic, game-theory-sound deposit curve (Tiers: 1.0, 0.909, 0.826 NXD/DXN).
3. **Dual-Reward Continuous Linear Streaming**: 7-day rolling emission streams in the Staking Vault for both **ETH** and **XEN**.
4. **In-Place Freezing Emergency Mode**: Secure vault protection where streams pause, funds remain preserved in-contract, and users withdraw 100% principal and rewards without penalty.
5. **Dual Withdrawal Paths**: Optional instant exit with 25% penalty burn or 24-hour non-penalized cooldown.
6. **Two-Step Governance**: Cryptographically secure \`transferGovernance()\` and \`acceptGovernance()\` workflow.
7. **Autonomous Pair Discovery**: \`TaxRecipientV3\` dynamically queries Uniswap V2 factory as single source of truth.
8. **Automated Leftover Sweep**: Self-cleaning routine that stakes residual DXN dust every 100 executions.
9. **Front-End Analytics & Charting Views**: High-granularity 7-day epoch tracking for burns (\`epochBurned\`) and vault inflows (\`ethInflowByEpoch\`, \`xenInflowByEpoch\`).
10. **Deterministic CREATE2 Token Deployment**: Guarantees \`NXD < DXN\` numerical address sorting on EVM for consistent Uniswap V2 LP pairing.
11. **L2 Sequencer & Oracle Downtime Shield**: Chainlink L2 Sequencer Uptime Feed integration with an enforced 1-hour grace period and 2-hour max price age, guarding protocol swaps from sequencer crash exploits.

---

## 8. Security & Audit Conclusions

The NXDv3 architecture resolves all primary security risks, economic vulnerabilities, and UX bottlenecks present in v2:

1. **MEV & Front-Running Immunity**: Moving DEX swaps and liquidity provisioning out of \`transfer()\` and \`receive()\` hooks completely eliminates sandwich attacks on token transfers and ETH receipts.
2. **Zero Risk of Out-of-Gas Transfer Failures**: Standard ERC-20 transfers execute strictly local storage updates, guaranteeing low, predictable gas costs and preventing transfer reverts caused by third-party DEX pool volatility or gas spikes.
3. **Pure Decentralization & Value Accrual**: By reducing developer cuts to **absolute zero** (0% mints, 0% taxes, 0% yield cuts), 100% of economic throughput is programmatically directed to deflationary buybacks (NXD/DXN burns), deep protocol-owned liquidity (POL), and continuous yields (ETH + XEN) for stakers.
4. **Resilient Capital Protection**: The vault's in-place freezing model guarantees that unforeseen black swan events pause distributions without risking staker deposits or trapping user assets.
5. **L2 Sequencer Downtime Resilience**: Dedicated Chainlink Sequencer Uptime Feed integration prevents trades during or immediately after L2 sequencer outages, ensuring arbitrageurs have sufficient grace period to re-align liquidity pool prices before contract executions resume.


`;

export const WhyModal: React.FC<WhyModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px', width: '92vw' }}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <HelpCircle size={20} className="icon-gold" />
            <h2 className="text-lg font-bold">Why NXDv3? — Technical Audit & Comparison Report</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary"
              onClick={handleCopy}
              style={{
                padding: '4px 8px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Copy as Markdown"
            >
              {copied ? <Check size={14} className="icon-success" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button className="modal-close-btn" onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        <div
          className="modal-body"
          style={{
            maxHeight: '72vh',
            overflowY: 'auto',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div className="why-markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1
                    {...props}
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      color: 'var(--accent-gold)',
                      marginTop: '0.25rem',
                      marginBottom: '0.85rem',
                      lineHeight: 1.35,
                      letterSpacing: '-0.01em',
                      ...props.style,
                    }}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    {...props}
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--accent-gold)',
                      marginTop: '2.25rem',
                      marginBottom: '1rem',
                      paddingBottom: '0.45rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      lineHeight: 1.4,
                      ...props.style,
                    }}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    {...props}
                    style={{
                      fontSize: '1.02rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginTop: '1.6rem',
                      marginBottom: '0.75rem',
                      lineHeight: 1.4,
                      ...props.style,
                    }}
                  />
                ),
                h4: ({ node, ...props }) => (
                  <h4
                    {...props}
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginTop: '1.25rem',
                      marginBottom: '0.5rem',
                      lineHeight: 1.4,
                      ...props.style,
                    }}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p
                    {...props}
                    style={{
                      marginBottom: '1rem',
                      lineHeight: 1.7,
                      color: 'var(--text-secondary)',
                      ...props.style,
                    }}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    {...props}
                    style={{
                      paddingLeft: '1.65rem',
                      marginTop: '0.5rem',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem',
                      listStyleType: 'disc',
                      ...props.style,
                    }}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    {...props}
                    style={{
                      paddingLeft: '1.65rem',
                      marginTop: '0.5rem',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      listStyleType: 'decimal',
                      ...props.style,
                    }}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li
                    {...props}
                    style={{
                      lineHeight: 1.65,
                      color: 'var(--text-secondary)',
                      ...props.style,
                    }}
                  />
                ),
                hr: ({ node, ...props }) => (
                  <hr
                    {...props}
                    style={{
                      margin: '2rem 0',
                      border: 'none',
                      borderTop: '1px solid var(--border-color)',
                      opacity: 0.25,
                      ...props.style,
                    }}
                  />
                ),
                code: ({ node, ...props }: any) => (
                  <code
                    {...props}
                    style={{
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: '0.86em',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--accent-gold)',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      ...props.style,
                    }}
                  />
                ),
                strong: ({ node, ...props }) => (
                  <strong
                    {...props}
                    style={{
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      ...props.style,
                    }}
                  />
                ),
                table: ({ node, ...props }) => (
                  <div
                    style={{
                      overflowX: 'auto',
                      margin: '1.25rem 0 1.75rem 0',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <table
                      {...props}
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        ...props.style,
                      }}
                    />
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead
                    {...props}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      ...props.style,
                    }}
                  />
                ),
                tbody: ({ node, ...props }) => <tbody {...props} />,
                tr: ({ node, ...props }) => (
                  <tr
                    {...props}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      ...props.style,
                    }}
                  />
                ),
                th: ({ node, ...props }) => (
                  <th
                    {...props}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      borderRight: '1px solid var(--border-color)',
                      borderBottom: '2px solid var(--border-color)',
                      ...props.style,
                    }}
                  />
                ),
                td: ({ node, ...props }) => (
                  <td
                    {...props}
                    style={{
                      padding: '10px 12px',
                      borderRight: '1px solid var(--border-color)',
                      borderBottom: '1px solid var(--border-color)',
                      ...props.style,
                    }}
                  />
                ),
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
