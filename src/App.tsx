import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import { ProtocolProvider } from './context/ProtocolContext';
import { Header } from './components/Header';
import { ProtocolDeposit } from './components/ProtocolDeposit';
import { VaultStaking } from './components/VaultStaking';
import { ProtocolStatsWindow } from './components/ProtocolStatsWindow';
import { ProtocolInfoCard } from './components/ProtocolInfoCard';
import { Footer } from './components/Footer';
import { AlertTriangle } from 'lucide-react';
import './styles.css';

// Code-split the charts page (and its Chart.js dependency) so it is only loaded
// when the user actually opens the Charts view.
const EpochChartsPage = lazy(() =>
  import('./components/EpochChartsPage').then((m) => ({ default: m.EpochChartsPage }))
);

const MainContent: React.FC = () => {
  const { networkConfig, networkWarning, switchNetwork } = useWallet();
  const addresses = networkConfig.addresses;

  return (
    <main className="main-content">
      {networkWarning && (
        <div
          className="alert alert-warning"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <span>{networkWarning}</span>
          </div>
          <button
            className="btn btn-secondary"
            style={{
              fontSize: '0.85rem',
              padding: '6px 14px',
              borderColor: '#fbbf24',
              color: '#fbbf24',
              whiteSpace: 'nowrap',
            }}
            onClick={() => switchNetwork(10)}
          >
            Switch to Optimism
          </button>
        </div>
      )}

      <div className="hero-section">
        {/*<h2>Maintenance</h2>*/}
        <h1>NXDv3 Protocol & Staking Hub</h1>
        <p>Deflationary DXNv2 Derivative</p>
        <p>Mint and stake NXDv3 tokens on the {networkConfig.name} network.</p>
      </div>

      <ProtocolStatsWindow
        protocolAddress={addresses.protocolAddress}
        nxdAddress={addresses.nxdAddress}
      />

      <div className="contracts-grid">
        <ProtocolDeposit
          protocolAddress={addresses.protocolAddress}
          dxnAddress={addresses.dxnAddress}
        />
        <VaultStaking vaultAddress={addresses.vaultAddress} nxdAddress={addresses.nxdAddress} />
      </div>

      <ProtocolInfoCard
        protocolAddress={addresses.protocolAddress}
        nxdAddress={addresses.nxdAddress}
      />
    </main>
  );
};

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'charts'>('dashboard');
  const { networkConfig } = useWallet();
  const addresses = networkConfig.addresses;

  return (
    <div className="app-container">
      <Header
        onOpenCharts={() => {
          setCurrentView('charts');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onGoHome={() => {
          setCurrentView('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      {currentView === 'dashboard' ? (
        <MainContent />
      ) : (
        <Suspense
          fallback={
            <div className="main-content">
              <div className="hero-section" style={{ textAlign: 'center' }}>
                <h1>Loading Charts…</h1>
              </div>
            </div>
          }
        >
          <EpochChartsPage
            onBack={() => {
              setCurrentView('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            nxdAddress={addresses.nxdAddress}
            XenAddress={addresses.XenAddress}
            dxnAddress={addresses.dxnAddress}
            protocolAddress={addresses.protocolAddress}
            taxRecipientAddress={addresses.taxRecipientAddress}
          />
        </Suspense>
      )}
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('Autoplay was prevented:', err);
      });
    }

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Clean up any previously stored scroll position
    try {
      sessionStorage.removeItem('app_scroll_pos');
    } catch {
      // ignore
    }
  }, []);

  return (
    <WalletProvider>
      <ProtocolProvider>
        <video ref={videoRef} autoPlay loop muted playsInline className="background-video">
          <source src="/red_plate.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="video-overlay" />
        <AppContent />
      </ProtocolProvider>
    </WalletProvider>
  );
};

export default App;
