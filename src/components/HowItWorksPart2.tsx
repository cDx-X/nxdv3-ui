import React from 'react';
import { Shield, Flame, Globe } from 'lucide-react';

export const HowItWorksPart2: React.FC = () => (
  <>
    <div className="doc-section">
      <h3>
        <Shield size={18} className="icon-gold" /> 4. Transaction Tax Engine (5% Sell/Transfer Tax)
      </h3>
      <p>
        Every taxable transfer or sale of NXDv3 incurs a 5% protocol tax, feeding directly into
        liquidity reinforcement and token burn routines.
      </p>
      <p>
        <strong>Asynchronous Gas-Optimized Processing (TaxRecipientV3):</strong>
      </p>
      <p>
        To prevent high gas overhead during regular transfers, tax collected on address(this) is
        processed asynchronously via <code>processTax()</code>:
      </p>
      <ul>
        <li>
          <strong>40% of Tax:</strong> Sold for DXNv2 on Uniswap V2 - transfer to TaxRecipientV3
          (protected by TWAP Price Oracles).
        </li>
        <li>
          <strong>30% of Tax:</strong> Burned immediately (reducing circulating supply).
        </li>
        <li>
          <strong>30% of Tax:</strong> Transferred to TaxRecipientV3:
          <ul>
            <li>25% of accumulated DXNv2 is restaked into the DBxenv2 protocol.</li>
            <li>
              The remaining DXNv2 and NXDv3 are paired to auto-inject Protocol-Owned Liquidity
              (Auto-LP) into Uniswap V2, strengthening the NXDv3/DXNv2 price floor.
            </li>
          </ul>
        </li>
      </ul>
    </div>

    <div className="doc-section">
      <h3>
        <Shield size={18} className="icon-gold" /> 5. Security and Anti-Manipulation Features
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
      </ul>
    </div>

    <div className="doc-section">
      <h3>
        <Flame size={18} className="icon-gold" /> 📊 Summary of Deflationary Drivers
      </h3>
      <ol>
        <li>
          🔥 <strong>30% of all transaction taxes</strong> are burned upon tax processing.
        </li>
        <li>
          🔥 <strong>ETH fee rewards</strong> systematically buy back $NXDv3 from the open market
          and burn 100% of it.
        </li>
        <li>
          🔥 <strong>Instant unstaking</strong> imposes a 25% burn penalty on emergency withdrawals.
        </li>
        <li>
          🔥 <strong>10% of all $DXNv2</strong> acquired via ETH rewards is sent directly to
          DEADBEEF and burned forever.
        </li>
      </ol>
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
