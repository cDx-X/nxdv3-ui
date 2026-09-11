import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { NETWORKS } from '../config/networks';
import {
  Wallet,
  LogOut,
  CheckCircle,
  Flame,
  ExternalLink,
  ChevronDown,
  BarChart3,
  Globe,
  Menu,
  X,
  Coins,
  QrCode,
  AlertTriangle,
} from 'lucide-react';
import { WebsiteQRCodeModal } from './WebsiteQRCodeModal';

interface HeaderProps {
  onOpenCharts: () => void;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCharts, onGoHome }) => {
  const {
    address,
    isConnected,
    isConnecting,
    chainId,
    networkConfig,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWallet();

  const [openDropdown, setOpenDropdown] = useState<'nxd' | 'dxn' | 'network' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const getNxdDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const networkDropdownRef = useRef<HTMLDivElement>(null);

  const getDropdownStyle = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (typeof window !== 'undefined' && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const isRightAligned = rect.left > window.innerWidth / 2;
      return {
        position: 'fixed' as const,
        top: `${rect.bottom + 6}px`,
        width: `${rect.width}px`,
        minWidth: `${rect.width}px`,
        boxSizing: 'border-box' as const,
        ...(isRightAligned
          ? { right: `${Math.max(12, window.innerWidth - rect.right)}px`, left: 'auto' as const }
          : { left: `${Math.max(12, rect.left)}px`, right: 'auto' as const }),
        zIndex: 99999,
      };
    }
    return {};
  };

  // Close dropdowns on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const formatAddress = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  return (
    <>
      <header className="header">
        <button
          type="button"
          className="header-logo"
          onClick={() => {
            if (onGoHome) onGoHome();
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
            font: 'inherit',
          }}
          aria-label="Go to home page"
        >
          <div className="header-logo-main">
            <span className="logo-text-gradient">NXD v3 Hub</span>
            <span className={`logo-badge ${networkConfig.chainId === 369 ? 'pulsechain' : ''}`}>
              {networkConfig.name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img
              src="/dxn-hyperstructure.png"
              alt="DXN Hyperstructure"
              style={{ width: '16px', height: '16px', objectFit: 'contain' }}
            />
            <span
              style={{
                color: 'var(--text-secondary, #94a3b8)',
                fontSize: '0.82rem',
                fontWeight: '500',
              }}
            >
              DXNv2 Hyperstructure
            </span>
          </div>
        </button>

        {/* Desktop Navbar Actions */}
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              padding: '6px 14px',
              borderColor: 'var(--accent-blue)',
              color: 'var(--accent-blue)',
            }}
            onClick={onOpenCharts}
          >
            <BarChart3 size={16} className="icon-blue" />
            <span>Charts</span>
          </button>

          <div className="dropdown-container" ref={getNxdDropdownRef}>
            <button
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                padding: '6px 14px',
                borderColor: 'var(--accent-gold)',
                color: 'var(--accent-gold)',
              }}
              onClick={() => setOpenDropdown(openDropdown === 'nxd' ? null : 'nxd')}
            >
              <Coins size={16} className="icon-gold" />
              <span>Get NXDv3</span>
              <ChevronDown
                size={14}
                style={{
                  transform: openDropdown === 'nxd' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
          </div>

          <div className="dropdown-container" ref={dropdownRef}>
            <button
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                padding: '6px 14px',
                borderColor: 'var(--accent-gold)',
                color: 'var(--accent-gold)',
              }}
              onClick={() => setOpenDropdown(openDropdown === 'dxn' ? null : 'dxn')}
            >
              <Coins size={16} className="icon-gold" />
              <span>Get DXNv2</span>
              <ChevronDown
                size={14}
                style={{
                  transform: openDropdown === 'dxn' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
          </div>

          {/* Network Switcher Dropdown */}
          <div className="dropdown-container" ref={networkDropdownRef}>
            <button
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                padding: '6px 14px',
                borderColor: networkConfig.chainId === 10 ? '#ff0420' : '#ff79c6',
                color: networkConfig.chainId === 10 ? '#ff0420' : '#ff79c6',
              }}
              onClick={() => setOpenDropdown(openDropdown === 'network' ? null : 'network')}
            >
              <Globe
                size={16}
                style={{ color: networkConfig.chainId === 10 ? '#ff0420' : '#ff79c6' }}
              />
              <span style={{ fontWeight: 'bold' }}>{networkConfig.name}</span>
              <ChevronDown
                size={14}
                style={{
                  transform: openDropdown === 'network' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
          </div>

          <button
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              padding: '6px 14px',
              borderColor: 'var(--accent-gold)',
              color: 'var(--accent-gold)',
            }}
            onClick={() => setIsQrModalOpen(true)}
            title="Scan QR Code to open on phone"
          >
            <QrCode size={16} className="icon-gold" />
            <span>Mobile QR</span>
          </button>

          {isConnected && address ? (
            <div className="wallet-connected-group">
              <div className="wallet-address-pill">
                <CheckCircle size={14} className="icon-success" />
                <span>{formatAddress(address)}</span>
              </div>
              <button
                className="btn-disconnect"
                onClick={disconnectWallet}
                title="Disconnect Wallet"
              >
                <LogOut size={16} />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <button
              className="btn-connect"
              onClick={isConnecting ? disconnectWallet : connectWallet}
              title={isConnecting ? 'Cancel connection' : 'Connect Wallet'}
            >
              <Wallet size={16} />
              <span>{isConnecting ? 'Connecting... (tap to cancel)' : 'Connect Wallet'}</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="header-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Navigation Menu'}
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Wallet connection error banner (e.g. stuck/blocked connection or init failure) */}
      {error && (
        <div
          className="wallet-error-banner"
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '1rem',
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
        </div>
      )}

      {/* Floating Dropdown Overlay (Escapes header stacking context & backdrop-filter) */}
      {openDropdown && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99998,
              background: 'transparent',
            }}
            onClick={() => setOpenDropdown(null)}
          />
          <div
            className="dropdown-menu"
            // eslint-disable-next-line react-hooks/refs
            style={getDropdownStyle(
              openDropdown === 'nxd'
                ? getNxdDropdownRef
                : openDropdown === 'dxn'
                ? dropdownRef
                : networkDropdownRef
            )}
          >
            {openDropdown === 'nxd' && (
              <>
                <a
                  href={`https://app.uniswap.org/swap?outputCurrency=${networkConfig.addresses.nxdAddress || '0xac8693Ef7F8f8bF093DAFdFd88060AcFeb298F13'}&chain=optimism`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dropdown-item"
                  onClick={() => setOpenDropdown(null)}
                >
                  <span>Uniswap</span>
                  <ExternalLink size={14} className="text-gray" />
                </a>
                <a
                  href={`https://dexscreener.com/optimism/${networkConfig.addresses.nxdAddress || '0xac8693Ef7F8f8bF093DAFdFd88060AcFeb298F13'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dropdown-item"
                  onClick={() => setOpenDropdown(null)}
                >
                  <span>Dexscreener</span>
                  <ExternalLink size={14} className="text-gray" />
                </a>
              </>
            )}

            {openDropdown === 'dxn' && (
              <>
                <a
                  href="https://app.uniswap.org/swap?outputCurrency=0x90386DA49028ef1eF18F47f0a740cAAB50782576&chain=optimism"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dropdown-item"
                  onClick={() => setOpenDropdown(null)}
                >
                  <span>Uniswap</span>
                  <ExternalLink size={14} className="text-gray" />
                </a>
                <a
                  href="https://dbxen-v2.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dropdown-item"
                  onClick={() => setOpenDropdown(null)}
                >
                  <span>dbXen v2 vercel</span>
                  <ExternalLink size={14} className="text-gray" />
                </a>
                <a
                  href="https://dbxen.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dropdown-item"
                  onClick={() => setOpenDropdown(null)}
                >
                  <span>dbXen v2 app</span>
                  <ExternalLink size={14} className="text-gray" />
                </a>
              </>
            )}

            {openDropdown === 'network' && (
              <>
                {Object.values(NETWORKS)
                  .filter((net) => net.chainId !== 369)
                  .map((net) => {
                    const isOpt = net.chainId === 10;
                    const itemColor = isOpt ? '#ff0420' : '#ff79c6';
                    return (
                      <button
                        key={net.chainId}
                        className="dropdown-item"
                        style={{
                          width: '100%',
                          background:
                            net.chainId === Number(chainId)
                              ? 'rgba(255,255,255,0.05)'
                              : 'transparent',
                          textAlign: 'left',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          color: itemColor,
                        }}
                        onClick={() => {
                          setOpenDropdown(null);
                          switchNetwork(net.chainId);
                        }}
                      >
                        <span
                          style={{
                            fontWeight: net.chainId === Number(chainId) ? 'bold' : 'normal',
                            color: itemColor,
                          }}
                        >
                          {net.name}
                        </span>
                        {net.chainId === Number(chainId) && (
                          <CheckCircle size={14} className="text-green" />
                        )}
                      </button>
                    );
                  })}
              </>
            )}
          </div>
        </>
      )}

      {/* Mobile Nav Drawer */}
      <div
        className={`mobile-nav-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        className={`mobile-nav-drawer ${isMobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="mobile-drawer-header">
          <button
            type="button"
            onClick={() => {
              if (onGoHome) onGoHome();
              setIsMobileMenuOpen(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
              font: 'inherit',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Go to home page"
          >
            <div className="header-logo-main">
              <span className="logo-text-gradient" style={{ fontSize: '1.15rem' }}>
                NXD v3 Hub
              </span>
              <span className={`logo-badge ${networkConfig.chainId === 369 ? 'pulsechain' : ''}`}>
                {networkConfig.name}
              </span>
            </div>
          </button>
          <button
            className="modal-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mobile-drawer-content">
          {/* Wallet Section */}
          <div className="mobile-drawer-section">
            <span className="mobile-drawer-section-title">Wallet</span>
            {isConnected && address ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  className="wallet-address-pill"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                >
                  <CheckCircle size={15} className="icon-success" />
                  <span>{formatAddress(address)}</span>
                </div>
                <button
                  className="btn btn-disconnect"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    disconnectWallet();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <LogOut size={16} />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            ) : (
              <button
                className="btn btn-connect full-width"
                onClick={() => {
                  if (isConnecting) {
                    disconnectWallet();
                  } else {
                    connectWallet();
                  }
                  setIsMobileMenuOpen(false);
                }}
              >
                <Wallet size={16} />
                <span>{isConnecting ? 'Connecting... (tap to cancel)' : 'Connect Wallet'}</span>
              </button>
            )}
            {error && (
              <div className="wallet-error-banner" role="alert" style={{ marginTop: '8px', fontSize: '0.78rem' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{error}</span>
              </div>
            )}
          </div>

          {/* Network Selection */}
          <div className="mobile-drawer-section">
            <span className="mobile-drawer-section-title">Network</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
              {Object.values(NETWORKS).map((net) => {
                const isCurrent = net.chainId === Number(chainId);
                const isOpt = net.chainId === 10;
                return (
                  <button
                    key={net.chainId}
                    className="mobile-drawer-btn"
                    style={{
                      borderColor: isCurrent
                        ? isOpt
                          ? '#ff0420'
                          : '#ff79c6'
                        : 'var(--border-color)',
                      background: isCurrent ? 'rgba(255,255,255,0.06)' : 'var(--bg-surface)',
                    }}
                    onClick={() => {
                      switchNetwork(net.chainId);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Globe size={16} style={{ color: isOpt ? '#ff0420' : '#ff79c6' }} />
                    <span style={{ flex: 1, fontWeight: isCurrent ? '700' : '500' }}>
                      {net.name}
                    </span>
                    {isCurrent && <CheckCircle size={15} className="text-green" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Items */}
          <div className="mobile-drawer-section">
            <span className="mobile-drawer-section-title">Navigation & Tools</span>
            <button
              className="mobile-drawer-btn"
              onClick={() => {
                setIsQrModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              <span>Mobile QR Code (Connect)</span>
            </button>
            <button
              className="mobile-drawer-btn"
              onClick={() => {
                onOpenCharts();
                setIsMobileMenuOpen(false);
              }}
            >
              <BarChart3 size={18} className="icon-blue" />
              <span>Protocol Charts Hub</span>
            </button>
          </div>

          {/* External Links - Get NXDv3 */}
          <div className="mobile-drawer-section">
            <span className="mobile-drawer-section-title">Get NXDv3</span>
            <a
              href={`https://app.uniswap.org/swap?outputCurrency=${networkConfig.addresses.nxdAddress || '0xac8693Ef7F8f8bF093DAFdFd88060AcFeb298F13'}&chain=optimism`}
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-drawer-btn"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Coins size={16} className="icon-gold" />
              <span>Uniswap Pool</span>
              <ExternalLink size={14} className="text-gray" style={{ marginLeft: 'auto' }} />
            </a>
            <a
              href={`https://dexscreener.com/optimism/${networkConfig.addresses.nxdAddress || '0xac8693Ef7F8f8bF093DAFdFd88060AcFeb298F13'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-drawer-btn"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Coins size={16} className="icon-gold" />
              <span>Dexscreener</span>
              <ExternalLink size={14} className="text-gray" style={{ marginLeft: 'auto' }} />
            </a>
          </div>

          {/* External Links */}
          <div className="mobile-drawer-section">
            <span className="mobile-drawer-section-title">Get DXNv2</span>
            <a
              href="https://app.uniswap.org/swap?outputCurrency=0x90386DA49028ef1eF18F47f0a740cAAB50782576&chain=optimism"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-drawer-btn"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Flame size={16} className="icon-gold" />
              <span>Uniswap Pool</span>
              <ExternalLink size={14} className="text-gray" style={{ marginLeft: 'auto' }} />
            </a>
            <a
              href="https://dbxen-v2.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-drawer-btn"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ExternalLink size={16} className="icon-gold" />
              <span>dbXen v2 Vercel</span>
              <ExternalLink size={14} className="text-gray" style={{ marginLeft: 'auto' }} />
            </a>
            <a
              href="https://dbxen.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-drawer-btn"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ExternalLink size={16} className="icon-gold" />
              <span>dbXen v2 App</span>
              <ExternalLink size={14} className="text-gray" style={{ marginLeft: 'auto' }} />
            </a>
          </div>
        </div>
      </aside>

      <WebsiteQRCodeModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} />
    </>
  );
};
