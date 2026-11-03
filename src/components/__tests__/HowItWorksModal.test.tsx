import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';
import { HowItWorksModal } from '../HowItWorksModal';

describe('HowItWorksModal', () => {
  it('does not render when closed', () => {
    const { container } = render(<HowItWorksModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the guide and table in the report layout', () => {
    const { container } = render(<HowItWorksModal isOpen onClose={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'NXD v3 — Protocol Documentation' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Multi-Tier Deposit Minting Engine/ })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Security Architecture/ })).toBeInTheDocument();
    const modal = container.querySelector('.modal-content');
    expect(modal).toHaveStyle({ maxWidth: '900px' });
    expect(modal?.getAttribute('style')).toContain('92vw');
    expect(container.querySelector('.how-it-works-body')).toContainElement(
      screen.getByRole('table')
    );
    expect(screen.getByRole('table').parentElement).toHaveClass('doc-table-wrapper');
    expect(screen.getAllByRole('row')).toHaveLength(7);
  });

  it('closes using either button and the backdrop, but not the content', () => {
    const onClose = vi.fn();
    const { container } = render(<HowItWorksModal isOpen onClose={onClose} />);
    fireEvent.click(screen.getByText(/NXDv3 Protocol/));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Got It, Close Guide' }));
    fireEvent.click(container.firstElementChild!);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('copies content to clipboard and toggles copied state', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<HowItWorksModal isOpen={true} onClose={vi.fn()} />);

    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    expect(screen.getByText('Copy')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalled();
    expect(screen.getByText('Copied')).toBeInTheDocument();
  });
});
