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
              {/* <li>
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
              </li> */}
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
              {/*<a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                title="X (Twitter)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>*/}
              <a
                href="https://t.me/DBXenV2"
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
      {/* <WhyModal isOpen={isWhyOpen} onClose={() => setIsWhyOpen(false)} /> */}
    </>
  );
};
