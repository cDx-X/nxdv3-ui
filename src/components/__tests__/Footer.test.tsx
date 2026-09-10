import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Copy: () => React.createElement('span', null, 'Copy'),
  ExternalLink: () => React.createElement('span', null, 'ExternalLink'),
  BookOpen: () => React.createElement('span', null, 'BookOpen'),
  Scale: () => React.createElement('span', null, 'Scale'),
  Check: () => React.createElement('span', null, 'Check'),
  ShieldCheck: () => React.createElement('span', null, 'ShieldCheck'),
  HelpCircle: () => React.createElement('span', null, 'HelpCircle'),
}));

// Mock child components
vi.mock('./TermsModal', () => ({
  TermsModal: () => null,
}));
vi.mock('./AuditModal', () => ({
  AuditModal: () => null,
}));
vi.mock('./HowItWorksModal', () => ({
  HowItWorksModal: () => null,
}));
vi.mock('./WhyModal', () => ({
  WhyModal: () => null,
}));

import { Footer } from '../Footer';

describe('Footer', () => {
  it('renders contract addresses section', () => {
    render(React.createElement(Footer));

    expect(screen.getByText('Contract Addresses')).toBeInTheDocument();
  });

  it('renders NXDv3 Protocol address', () => {
    render(React.createElement(Footer));

    expect(screen.getByText('NXDv3 Protocol:')).toBeInTheDocument();
  });

  it('renders NXDv3 Token address', () => {
    render(React.createElement(Footer));

    expect(screen.getByText('NXDv3 Token:')).toBeInTheDocument();
  });

  it('renders Staking Vault address', () => {
    render(React.createElement(Footer));

    expect(screen.getByText('NXDv3 Staking Vault:')).toBeInTheDocument();
  });

  it('renders resources section', () => {
    render(React.createElement(Footer));

    expect(screen.getByText('Resources')).toBeInTheDocument();
  });

  it('renders audit link', () => {
    render(React.createElement(Footer));

    expect(screen.getByText('Audit')).toBeInTheDocument();
  });

  it('renders terms link', () => {
    render(React.createElement(Footer));

    expect(screen.getByText(/Terms & Disclaimer/)).toBeInTheDocument();
  });

  it('renders litepaper link', () => {
    render(React.createElement(Footer));

    expect(screen.getByText('Litepaper')).toBeInTheDocument();
  });

  it('renders why link', () => {
    render(React.createElement(Footer));

    expect(screen.getByText(/Why/)).toBeInTheDocument();
  });

  it('renders community section', () => {
    render(React.createElement(Footer));

    expect(screen.getByText('Community')).toBeInTheDocument();
  });

  it('renders footer bottom text', () => {
    render(React.createElement(Footer));

    expect(screen.getByText(/Non-custodial interface/)).toBeInTheDocument();
  });
});
