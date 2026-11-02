import React, { useState } from 'react';
import { CONTRACT_ADDRESSES } from '../abis/contracts';
import { Copy, ExternalLink, BookOpen, Scale, Check, ShieldCheck, HelpCircle } from 'lucide-react';
import { TermsModal } from './TermsModal';
import { AuditModal } from './AuditModal';
import { HowItWorksModal } from './HowItWorksModal';
import { WhyModal } from './WhyModal';

export const Footer: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isWhyOpen, setIsWhyOpen] = useState(false);

  const handleCopy = (key: string, address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const formatAddr = (addr: string) => {
    if (!addr) return '';
    if (addr.length <= 13) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const contracts = [
    { key: 'protocol', name: 'NXDv3 Protocol:', address: CONTRACT_ADDRESSES.protocolAddress },
    { key: 'nxdv2', name: 'NXDv3 Token:', address: CONTRACT_ADDRESSES.nxdAddress },
    { key: 'vault', name: 'NXDv3 Staking Vault:', address: CONTRACT_ADDRESSES.vaultAddress },
    {
      key: 'migration',
      name: 'Tax RecipientV3:',
      address: CONTRACT_ADDRESSES.taxRecipientAddress,
    },
    {
      key: 'processor',
      name: 'NXDv3 Processor:',
      address: CONTRACT_ADDRESSES.processorAddress,
    },
  ];

  const resources = [
    /*{ name: 'GitHub', icon: <Github size={14} />, href: 'https://github.com' },*/
    { name: 'XEN Network', icon: <ExternalLink size={14} />, href: 'https://xen.network' },
  ];

  return (
    <>
      <footer className="footer-section">
        <div className="footer-container">
          {/* Column 1: Contract Addresses */}
          <div className="footer-col">
            <h3 className="footer-title">Contract Addresses</h3>
            <div className="footer-contracts-list">
              {contracts.map((item) => (
                <div key={item.key} className="footer-contract-row">
                  <span className="footer-label">{item.name}</span>
                  <div className="footer-address-pill">
                    <span className="footer-address-text">{formatAddr(item.address)}</span>
                    <button
                      className="footer-icon-btn"
                      onClick={() => handleCopy(item.key, item.address)}
                      title="Copy address"
                    >
                      {copiedKey === item.key ? (
                        <Check size={14} className="icon-success" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <a
                      href={`https://optimistic.etherscan.io/address/${item.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-icon-btn"
                      title="View on Etherscan"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Resources */}
          <div className="footer-col footer-col-resources">
            <h3 className="footer-title">Resources</h3>
            <ul className="footer-links-list">
              <li>
                <button
                  onClick={() => setIsHowItWorksOpen(true)}
                  className="footer-link-item"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit',
                    textAlign: 'left',
                    width: '100%',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <BookOpen size={14} />
                  <span>Litepaper</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsWhyOpen(true)}
                  className="footer-link-item"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit',
                    textAlign: 'left',
                    width: '100%',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <HelpCircle size={14} />
                  <span>Why v3?</span>
                </button>
              </li>
              {resources.map((res, idx) => (
                <li key={idx}>
                  <a
                    href={res.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link-item"
                  >
                    {res.icon}
                    <span>{res.name}</span>
                  </a>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setIsAuditOpen(true)}
                  className="footer-link-item"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit',
                    textAlign: 'left',
                    width: '100%',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>Audit</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsTermsOpen(true)}
                  className="footer-link-item"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit',
                    textAlign: 'left',
                    width: '100%',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Scale size={14} />
                  <span>Terms & Disclaimer</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Community */}
          <div className="footer-col">
            <h3 className="footer-title">Community</h3>
            <div className="footer-community-icons">
              <a
                href="https://github.com/cDx-X/nxdv3-ui.git"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                title="GitHub"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://t.me/NXDv3"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                title="Telegram"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.08-.78 4.23-1.84 7.05-3.05 8.46-3.63 4.03-1.68 4.86-1.97 5.41-1.98.12 0 .38.03.55.17.14.12.18.28.2.45-.02.07-.02.13-.04.2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom-text">
         Non-custodial interface to third-party contracts. Not financial advice. No
          warranty.
        </div>
      </footer>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <AuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <WhyModal isOpen={isWhyOpen} onClose={() => setIsWhyOpen(false)} />
    </>
  );
};
