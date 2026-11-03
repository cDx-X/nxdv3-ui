import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Check } from 'lucide-react';
import { AuditPart1 } from './AuditPart1';
import { AuditPart2 } from './AuditPart2';
import { AuditPart3 } from './AuditPart3';
import { AuditPart4 } from './AuditPart4';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const markdownContent = `# A.I. Smart Contract Architecture, Mathematical Verification, and Security Audit
NXDv3 Protocol smart contracts - audited periodically (Last updated: 10/09/2026)

## 1. Executive Summary
The NXD v3 Protocol is a decentralized ecosystem integrating deflationary tokenomics, autonomous liquidity balancing, multi-tier minting, and dual-asset staking rewards. The protocol consists of four core contracts:
- **NXDv3ERC20.sol**: Native token with an autonomous 7-day epoch burn-tracking engine, automated transfer tax routing, and dead-address burn redirection.
- **TaxRecipientV3.sol**: Tax processor and liquidity engine that liquidates tax tokens, stakes into DBXen, dynamically provisions Uniswap V2 liquidity, and locks LP tokens.
- **NXDv3Protocol.sol**: Primary coordinator handling CREATE2 token deployment, tiered deposit-based minting, DBXen fee harvesting, and automated multi-stage reward distribution.
- **NXDv3StakingVault.sol**: Dual-reward (ETH and XEN) staking vault utilizing a continuous 7-day linear distribution model with cooldown mechanics and emergency freezing.

### Key Architectural Strengths
1. **DEX-Decoupled Transfers:** Transfer hooks never trigger on-chain swaps.
2. **Deterministic Liquidity Ownership:** POL tokens permanently locked in TaxRecipientV3.
3. **Dual Continuous Reward Streaming:** 7-day linear streaming protecting against flash-loan dilution.
4. **Resilient Error Handling:** Non-reverting external calls preventing DoS vulnerabilities.

## 2. System Architecture & Contract Deep-Dive
- **NXDv3ERC20.sol**: Autonomous transfer tax, physical deflationary burning, analytics & epoch tracking, two-step governance.
- **TaxRecipientV3.sol**: Automated tax swapping, dynamic Uniswap V2 LP provisioning, DBXen restaking integration.
- **NXDv3Protocol.sol**: CREATE2 deterministic deployment, multi-tier deposit minting, DBXen harvesting, 5-stage reward distribution pipeline.
- **NXDv3StakingVault.sol**: O(1) continuous reward distribution, buffered unallocated rewards, independent claiming, 24h cooldown vs instant 25% burn withdrawal, emergency freeze.

## 3. Mathematical Verification & Invariants
- Constant Product Invariants, Supply Conservation, Deflationary Monotonicity.

## 4. Security & Vulnerability Analysis
- MEV resistance, Reentrancy protection, Integer overflow guards, Access control security.
`;

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
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
          <div className="flex items-center gap-2 modal-header-group">
            <ShieldCheck size={20} className="icon-gold" />
            <h2 className="text-lg font-bold">
              A.I. Smart Contract Architecture, Mathematical Verification, and Security Audit
            </h2>
            <p className="modal-header-subtitle">
              NXDv3 Protocol smart contracts - audited periodically
            </p>
            <p className="modal-header-subtitle">Last updated: 10/09/2026</p>
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

        <div className="modal-body audit-body">
          <AuditPart1 />
          <hr />
          <AuditPart2 />
          <hr />
          <AuditPart3 />
          <hr />
          <AuditPart4 />
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close Audit Report
          </button>
        </div>
      </div>
    </div>
  );
};
