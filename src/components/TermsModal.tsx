import React, { useState } from 'react';
import { X, Scale, Copy, Check } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const markdownContent = `# Terms & Disclaimer

## What this site is
This is a free, open-source web interface. It is a set of static files served to your browser. It reads public blockchain data and helps you build transactions that your own wallet signs and broadcasts.

## What it never does
- It never takes custody of your funds, tokens, keys, or seed phrase.
- It never takes a fee, commission, or cut of any transaction you make.
- It cannot move, freeze, reverse, or recover your assets — nobody operating this site can.
- It does not match orders, route trades, quote prices for you, or act as a broker, dealer, or exchange.

## It is not the protocol
DBXen V2, DXNv2, NXDv3, and XEN are independent third-party smart contracts deployed on public blockchains. They are immutable and have no admin keys, no upgrade path, and no owner — including the people who publish this interface. This site is one of many possible ways to reach those contracts; you can always interact with them directly. Contract addresses are listed in the footer so you can verify them yourself.

## Nothing here is advice
Nothing on this site is financial, investment, legal, tax, or accounting advice, and nothing here is a solicitation or recommendation to buy, sell, or hold anything. Figures, charts, projections, APR/APY estimates, and "estimated reward" values are informational approximations, not promises. Do your own research.

## Risks
- Smart contracts can contain bugs. Immutable contracts cannot be patched.
- Burning tokens is irreversible. Transactions cannot be undone.
- Token values are volatile and can go to zero.
- There is no refund, no support desk, no insurance, and no counterparty to make you whole.
- You can permanently lose everything you commit. Do not commit more than you can afford to lose.

## Your responsibility
You are responsible for the security of your wallet and keys, for verifying every transaction before you sign it, for verifying contract addresses, and for complying with the laws that apply to you where you live. This interface is not directed at, and should not be used by, anyone in a jurisdiction where using it would be unlawful, or by anyone subject to applicable sanctions.

## No warranty
This interface is provided "as is" and "as available", without warranty of any kind, express or implied. On-chain data shown here is fetched best-effort from public RPCs and block explorers that are operated by third parties and may be rate-limited, delayed, incomplete, or simply wrong. Some figures are estimates by construction and are labeled as such. Availability is not guaranteed and the site may change or disappear at any time. To the maximum extent permitted by law, the publishers of this interface accept no liability for any loss arising from its use.
`;

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
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
        style={{ maxWidth: '700px' }}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Scale size={20} className="icon-gold" />
            <h2 className="text-lg font-bold">Terms & Disclaimer</h2>
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
            maxHeight: '65vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-gold)' }}>
              What this site is
            </h3>
            <p>
              This is a free, open-source web interface. It is a set of static files served to your
              browser. It reads public blockchain data and helps you build transactions that your
              own wallet signs and broadcasts.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-gold)' }}>
              What it never does
            </h3>
            <ul
              style={{
                paddingLeft: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                listStyleType: 'disc',
              }}
            >
              <li>It never takes custody of your funds, tokens, keys, or seed phrase.</li>
              <li>It never takes a fee, commission, or cut of any transaction you make.</li>
              <li>
                It cannot move, freeze, reverse, or recover your assets — nobody operating this site
                can.
              </li>
              <li>
                It does not match orders, route trades, quote prices for you, or act as a broker,
                dealer, or exchange.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-gold)' }}>
              It is not the protocol
            </h3>
            <p>
              DBXen V2, DXNv2, NXDv3, and XEN are independent third-party smart contracts deployed
              on public blockchains. They are immutable and have no admin keys, no upgrade path, and
              no owner — including the people who publish this interface. This site is one of many
              possible ways to reach those contracts; you can always interact with them directly.
              Contract addresses are listed in the footer so you can verify them yourself.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-gold)' }}>
              Nothing here is advice
            </h3>
            <p>
              Nothing on this site is financial, investment, legal, tax, or accounting advice, and
              nothing here is a solicitation or recommendation to buy, sell, or hold anything.
              Figures, charts, projections, APR/APY estimates, and "estimated reward" values are
              informational approximations, not promises. Do your own research.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-gold)' }}>
              Risks
            </h3>
            <ul
              style={{
                paddingLeft: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                listStyleType: 'disc',
              }}
            >
              <li>Smart contracts can contain bugs. Immutable contracts cannot be patched.</li>
              <li>Burning tokens is irreversible. Transactions cannot be undone.</li>
              <li>Token values are volatile and can go to zero.</li>
              <li>
                There is no refund, no support desk, no insurance, and no counterparty to make you
                whole.
              </li>
              <li>
                You can permanently lose everything you commit. Do not commit more than you can
                afford to lose.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-gold)' }}>
              Your responsibility
            </h3>
            <p>
              You are responsible for the security of your wallet and keys, for verifying every
              transaction before you sign it, for verifying contract addresses, and for complying
              with the laws that apply to you where you live. This interface is not directed at, and
              should not be used by, anyone in a jurisdiction where using it would be unlawful, or
              by anyone subject to applicable sanctions.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-gold)' }}>
              No warranty
            </h3>
            <p>
              This interface is provided "as is" and "as available", without warranty of any kind,
              express or implied. On-chain data shown here is fetched best-effort from public RPCs
              and block explorers that are operated by third parties and may be rate-limited,
              delayed, incomplete, or simply wrong. Some figures are estimates by construction and
              are labeled as such. Availability is not guaranteed and the site may change or
              disappear at any time. To the maximum extent permitted by law, the publishers of this
              interface accept no liability for any loss arising from its use.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
};
