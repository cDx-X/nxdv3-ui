import React from 'react';
import { Shield, Flame, Globe } from 'lucide-react';

export const HowItWorksPart2: React.FC = () => (
  <>
    <div className="doc-section">
      <h3>
        <Shield size={18} className="icon-gold" /> 4. Transaction Tax & Liquidity Engine
      </h3>
      <p>
        Every taxable transfer or sale of NXDv3 incurs a <strong>5% protocol tax</strong>, feeding
        directly into liquidity reinforcement and token burn routines.
      </p>
      <p>
        <strong>Asynchronous Gas-Optimized Processing (TaxRecipientV3):</strong>
      </p>
      <p>
        To prevent high gas overhead and slippage during regular transfers, 
        tax handling is decoupled:
      </p>
      <ul>
        <li> 
          <strong>30% of the tax</strong> is burned immediately
        </li>
      </ul>
        ,while the remaining 70% is transferred directly to TaxRecipientV3 
        to be processed asynchronously via processTax():
      
      <ul>
        <li>
          <strong>40% of Total Tax:</strong> Swapped for DXNv2 on Uniswap V2 (protected by TWAP Price Oracles).
        </li>
        <li>
          <strong>30% of Total Tax:</strong> paired with DXNv2 to auto-inject Protocol-Owned Liquidity (Auto-LP) into Uniswap V2, 
          strengthening the NXDv3/DXNv2 price floor.
        </li>
        <li>
          <strong>DXNv2 Restaking:</strong> 25% of accumulated DXNv2 is restaked into the DBxenv2 protocol.
          </li>
      </ul>
    </div>

    <div className="doc-section">
      <h3>
        <Shield size={18} className="icon-gold" /> 5. Security Architecture
      </h3>
      <ul>
        <li>
          <strong>TWAP Price Oracles (V2 & V3 Oracle Integration):</strong> All automated market
          swaps are protected by time-weighted average price oracles to eliminate flash-loan attacks
          and MEV front-running.
        </li>
        <li>
          <strong>Slippage Protection:</strong> Embedded slippage parameters prevent protocol losses
          during volatile market conditions.
        </li>
        <li>
          <strong>Hard-Capped Max Supply:</strong> Total supply limits are hardcoded at deployment
          with zero mint functions accessible by governance.
        </li>
        <li>
          <strong>Create2 Deterministic Address Sorting:</strong> The ERC-20 token is deployed via
          create2 with a mined salt to guarantee token0 is always NXD and token1 is always DXN in
          the Uniswap V2 pair, eliminating token ordering mismatch bugs.
        </li>
        <li>
          <strong>Bytecode Optimization & EIP-3860 Compliance:</strong> Architecture is modularized
          into dedicated contracts (NXDv3Protocol, NXDv3ERC20, TaxRecipientV3, NXDv3StakingVault,
          V2Optimizer) to comply with Shanghai hard fork's initialization code size limit.
        </li>
        <li>
          <strong>Two-Step Governance:</strong> Administrative control over parameters (slippageBps,
          taxProcessor, rewardsProcessor) is governed by a 2-step transfer pattern (transferGovernance
          and acceptGovernance), preventing accidental assignment to null or invalid addresses.
        </li>
      </ul>
    </div>

    <div className="doc-section">
      <h3>
        <Flame size={18} className="icon-gold" /> 📊 Quantitative Summary of Deflationary Drivers
      </h3>
      <div className="doc-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Vector</th>
              <th>Mechanism</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Transfer Burn</td>
              <td>30% of all 5% transfer taxes (1.5% of volume) burned instantly</td>
              <td>Reduces circulating NXD on every non-whitelisted transaction</td>
            </tr>
            <tr>
              <td>Reward Engine Buyback & Burn</td>
              <td>55% of DXN from the 70% ETH reward buyback purchases and burns NXD</td>
              <td>Open-market buy pressure + 100% burn of acquired NXD</td>
            </tr>
            <tr>
              <td>DXN Reward Burn</td>
              <td>10% of DXN acquired from ETH rewards sent to DEAD</td>
              <td>Deflates underlying DXNv2 supply, reinforcing backing value</td>
            </tr>
            <tr>
              <td>Instant Unstake Penalty</td>
              <td>25% burn on non-cooldown withdrawals</td>
              <td>Penalizes short-term exits while reducing total NXD supply</td>
            </tr>
            <tr>
              <td>Perpetual DBXen Compounding</td>
              <td>100% of user mint deposits + 35% of reward DXN + 25% of tax DXN staked</td>
              <td>Protocol DBXen stake only ever increases, permanently growing ETH yield</td>
            </tr>
            <tr>
              <td>Protocol-Owned Liquidity (POL)</td>
              <td>30% tax NXD + matching tax DXN injected into Uniswap V2</td>
              <td>Deepens permanent liquidity and raises the mathematical price floor</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div className="doc-section summary-box">
      <h3>
        <Globe size={18} className="icon-gold" /> NXD v3 at a Glance
      </h3>
      <p>
        <strong>Deposit DXNv2 ➔ Mint NXDv3 ➔ Stake NXDv3 ➔ Earn ETH and XEN.</strong>
      </p>
      <p>
        Meanwhile, automated protocol engines buy back tokens, reinforce liquidity, and burn supply
        in the background to build long-term value.
      </p>
      
    </div>
  </>
);
