import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
  X: () => React.createElement('span', null, 'X'),
}));

// Mock child components
vi.mock('../TermsModal', () => ({
  TermsModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen
      ? React.createElement(
          'div',
          { 'data-testid': 'mock-terms-modal' },
          React.createElement('button', { onClick: onClose }, 'Close Terms')
        )
      : null,
}));
vi.mock('../AuditModal', () => ({
  AuditModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen
      ? React.createElement(
          'div',
          { 'data-testid': 'mock-audit-modal' },
          React.createElement('button', { onClick: onClose }, 'Close Audit')
        )
      : null,
}));
vi.mock('../HowItWorksModal', () => ({
  HowItWorksModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen
      ? React.createElement(
          'div',
          { 'data-testid': 'mock-how-it-works-modal' },
          React.createElement('button', { onClick: onClose }, 'Close HowItWorks')
        )
      : null,
}));
vi.mock('../WhyModal', () => ({
  WhyModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen
      ? React.createElement(
          'div',
          { 'data-testid': 'mock-why-modal' },
          React.createElement('button', { onClick: onClose }, 'Close Why')
        )
      : null,
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

  it('renders github community link', () => {
    render(React.createElement(Footer));

    const githubLink = screen.getByTitle('GitHub');
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/cDx-X/nxdv3-ui.git');
  });

  it('renders footer bottom text', () => {
    render(React.createElement(Footer));

    expect(screen.getByText(/Non-custodial interface/)).toBeInTheDocument();
  });

  it('opens and closes Litepaper modal (HowItWorks)', () => {
    render(React.createElement(Footer));
    expect(screen.queryByTestId('mock-how-it-works-modal')).not.toBeInTheDocument();

    const litepaperBtn = screen.getByRole('button', { name: /Litepaper/i });
    fireEvent.click(litepaperBtn);
    expect(screen.getByTestId('mock-how-it-works-modal')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Close HowItWorks/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('mock-how-it-works-modal')).not.toBeInTheDocument();
  });

  it('opens and closes Why modal', () => {
    render(React.createElement(Footer));
    expect(screen.queryByTestId('mock-why-modal')).not.toBeInTheDocument();

    const whyBtn = screen.getByRole('button', { name: /Why v3\?/i });
    fireEvent.click(whyBtn);
    expect(screen.getByTestId('mock-why-modal')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Close Why/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('mock-why-modal')).not.toBeInTheDocument();
  });

  it('opens and closes Audit modal', () => {
    render(React.createElement(Footer));
    expect(screen.queryByTestId('mock-audit-modal')).not.toBeInTheDocument();

    const auditBtn = screen.getByRole('button', { name: /Audit/i });
    fireEvent.click(auditBtn);
    expect(screen.getByTestId('mock-audit-modal')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Close Audit/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('mock-audit-modal')).not.toBeInTheDocument();
  });

  it('opens and closes Terms modal', () => {
    render(React.createElement(Footer));
    expect(screen.queryByTestId('mock-terms-modal')).not.toBeInTheDocument();

    const termsBtn = screen.getByRole('button', { name: /Terms & Disclaimer/i });
    fireEvent.click(termsBtn);
    expect(screen.getByTestId('mock-terms-modal')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Close Terms/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('mock-terms-modal')).not.toBeInTheDocument();
  });

  it('copies contract address to clipboard, updates icon and resets after timeout', () => {
    vi.useFakeTimers();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(React.createElement(Footer));

    const copyButtons = screen.getAllByTitle('Copy address');
    expect(copyButtons.length).toBeGreaterThan(0);

    // Initial state: rendered Copy icon
    expect(screen.queryByText('Check')).not.toBeInTheDocument();

    // Click the first copy button (protocol)
    act(() => {
      fireEvent.click(copyButtons[0]);
    });

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Check')).toBeInTheDocument();

    // Fast-forward 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Icon reverts back
    expect(screen.queryByText('Check')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
