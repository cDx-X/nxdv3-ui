import React from 'react';
import { Activity, Zap, Cpu, Lock } from 'lucide-react';

export const HowItWorksPart1: React.FC = () => (
  <>
    <div className="doc-section">
      <h3>
        <Activity size={18} className="icon-gold" /> 🌀 The Core Flywheel
      </h3>
      <p>The NXD v3 economy operates on a closed-loop value funnel:</p>
      <div className="flywheel-box">
        [Deposit DXN] ➔ [Stake in DBXen] ➔ [Generate ETH]
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▲&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼
        <br />
        [Auto-LP & Restaking] ◄─ [Distribute & Buyback $NXD/$DXN/ETH]
      </div>
      <ol>
        <li>
          Users deposit $DXNv2 to mint $NXDv3 tokens or deposit $DXNv2 to "no mint" option ("no mint
          deposit" available during and after the minting process)
        </li>
        <li>
          All deposited $DXNv2 is permanently locked and staked into DBXenV2, building a
          non-custodial yield engine that collects ETH fees.
        </li>
        <li>The protocol claims accumulated ETH fees and triggers the Reward Engine.</li>
        <li>
          Collected ETH is split between DXNv2 buybacks, DXNv2/NXDv3 burns and direct Real Yield ETH
          and XEN payouts for stakers.
        </li>
      </ol>
    </div>

    <div className="doc-section">
      <h3>
        <Zap size={18} className="icon-gold" /> 1. Tiered Minting Engine
      </h3>
      <p>
        The total NXDv3 supply allocated for deposit minting is strictly capped and divided into 3
        Tiers, rewarding early protocol participants with better conversion rates:
      </p>
      <ul>
        <li>
          <strong>Tier 1: 1:1 Rate</strong> – For every 1 DXNv2 deposited, you receive 1.00 $NXDv3.
        </li>
        <li>
          <strong>Tier 2: 1:0.909 Rate</strong> – For every 1 DXNv2 deposited, you receive ~0.909
          NXDv3 (~9% reduction).
        </li>
        <li>
          <strong>Tier 3: 1:0.826 Rate</strong> – For every 1 DXNv2 deposited, you receive ~0.826
          NXDv3 (~9% further reduction).
        </li>
      </ul>
      <p className="insight-box">
        💡 <strong>Key Insight:</strong> All DXNv2 deposited during minting immediately increases
        NXDv3's permanent staking position in DBXen. This scales up protocol-wide ETH fee
        generation—once deposited, DXN generates yield for the ecosystem forever.
      </p>
    </div>

    <div className="doc-section">
      <h3>
        <Cpu size={18} className="icon-gold" /> 2. The ETH Reward Engine (processRewards)
      </h3>
      <p>
        Whenever accumulated ETH fee claims reach the protocol, executing{' '}
        <code>processRewards()</code> triggers a multi-step algorithmic execution:
      </p>
      <p>
        <strong>📊 ETH Allocation Breakdown:</strong>
      </p>
      <ul>
        <li>
          <strong>70% ETH ➔ $DXNv2 Buyback (Uniswap V3)</strong>
          <ul>
            <li>10% of the bought $DXNv2 is sent to DEADBEEF and burned forever.</li>
            <li>
              35% of the bought $DXNv2 is restaked into DBXenV2, compounding future ETH yields.
            </li>
            <li>
              55% of the remaining $DXNv2 buys NXDv3 from the UniswapV2 market and the acquired
              NXDv3 is burned.
            </li>
          </ul>
        </li>
        <li>
          <strong>15% ETH ➔ Staking Vault (NXDv3 Stakers)</strong>
          <ul>
            <li>
              Transferred directly to the Staking Vault as Real Yield in native ETH for active NXDv3
              stakers.
            </li>
          </ul>
        </li>
        <li>
          <strong>15% ETH ➔ $XEN Buyback (NXDv3 Stakers)</strong>
          <ul>
            <li>Swaps ETH for XEN on Uniswap V3 and transfers it to Staking Vault</li>
          </ul>
        </li>
      </ul>
    </div>

    <div className="doc-section">
      <h3>
        <Lock size={18} className="icon-gold" /> 3. Staking Vault: Real Yield in Native ETH
      </h3>
      <p>
        The NXDv3 Staking Vault is optimized for extreme gas efficiency O(1) and accumulates ETH and
        XEN rewards.
      </p>
      <p>
        <strong>Staking Mechanics:</strong>
      </p>
      <ul>
        <li>
          <strong>Instant Yield Accumulation:</strong> Stake NXDv3 at any time to start accruing raw
          ETH and XEN rewards instantly.
        </li>
        <li>
          <strong>O(1) Global Index:</strong> The reward index updates efficiently regardless of the
          number of active pool participants.
        </li>
      </ul>
      <p>
        <strong>Game-Thriving Unstaking Options:</strong>
      </p>
      <p>When withdrawing your staked NXDv3, you choose between two paths:</p>
      <ol>
        <li>
          <strong>Standard Unstake (0% Penalty):</strong>
          <ul>
            <li>Submit an unstake request (Withdraw Requested).</li>
            <li>A 24-hour cooldown period is initiated.</li>
            <li>After 24 hours, claim 100% of your NXDv3 tokens with zero fees.</li>
          </ul>
        </li>
        <li>
          <strong>Instant Unstake (25% Burn Penalty):</strong>
          <ul>
            <li>Bypass the 24-hour cooldown and receive your tokens immediately.</li>
            <li>
              25% of your withdrawn $NXD is burned instantly, increasing scarcity for all remaining
              token holders.
            </li>
            <li>Applies to tokens not subject to the 24-hour cooldown.</li>
          </ul>
        </li>
      </ol>
    </div>
  </>
);
