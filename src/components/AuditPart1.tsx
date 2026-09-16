import React from 'react';

export const AuditPart1: React.FC = () => {
  return (
    <div className="audit-section-stack">
      <div>
        <h3>
          1. Executive Summary
        </h3>
        <p className="audit-intro">
          The NXD v3 Protocol is a decentralized ecosystem integrating deflationary tokenomics,
          autonomous liquidity balancing, multi-tier minting, and dual-asset staking rewards. The
          protocol consists of four core contracts:
        </p>
        <ul>
          <li>
            <strong>NXDv3ERC20.sol</strong>: The native token with an autonomous 7-day epoch
            burn-tracking engine, automated transfer tax routing, and dead-address burn redirection.
          </li>
          <li>
            <strong>TaxRecipientV3.sol</strong>: A dedicated tax processor and liquidity engine that
            liquidates tax tokens, stakes a portion into DBXen, dynamically provisions Uniswap V2
            liquidity, and permanently locks LP tokens.
          </li>
          <li>
            <strong>NXDv3Protocol.sol</strong>: The primary coordinator handling CREATE2 token
            deployment, tiered deposit-based minting, DBXen fee harvesting, and automated multi-stage
            reward distribution.
          </li>
          <li>
            <strong>NXDv3StakingVault.sol</strong>: A dual-reward (ETH and XEN) staking vault
            utilizing a continuous 7-day linear distribution model (Synthetix-style), complete with
            cooldown mechanics, in-place emergency freezing, and epoch-based inflow analytics.
          </li>
        </ul>
      </div>

      <div>
        <h3>
          Key Architectural Strengths
        </h3>
        <div className="audit-section-stack">
          <div>
            <h4>
              1. DEX-Decoupled Transfers
            </h4>
            <p>
              Standard ERC-20 transfers never trigger on-chain swaps. The transfer hook (
              <code>_update</code>) strictly performs balances updates, immediate burn execution, and
              fee transfers. Slippage, routing, and decentralized exchange (DEX) interactions are
              handled asynchronously via dedicated functions.
            </p>
          </div>
          <div>
            <h4>
              2. Deterministic Liquidity Ownership
            </h4>
            <p>
              All liquidity tokens minted via the tax engine are held by the TaxRecipientV3 contract
              itself with no withdrawal or extraction functions, establishing permanent,
              protocol-owned liquidity.
            </p>
          </div>
          <div>
            <h4>
              3. Dual Continuous Reward Streaming
            </h4>
            <p>
              Instead of lump-sum block distributions, staking rewards are streamed continuously over
              7-day periods, protecting stakers against flash-loan dilution and sandwich attacks.
            </p>
          </div>
          <div>
            <h4>
              4. Resilient Error Handling
            </h4>
            <p>
              Both native ETH and ERC-20 token distributions employ non-reverting external calls with
              internal balance state restorations to prevent denial-of-service (DoS) vulnerabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
