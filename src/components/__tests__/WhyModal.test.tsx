import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WhyModal } from '../WhyModal';

describe('WhyModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(<WhyModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders report markdown content when open', () => {
    const onClose = vi.fn();
    render(<WhyModal isOpen={true} onClose={onClose} />);

    expect(
      screen.getByRole('heading', {
        name: 'Why NXDv3? — Technical Audit & Comparison Report',
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Comprehensive Technical Audit & Comparison Report: NXD \(v2\) vs. NXDv3/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/1. Global & Architectural Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/2. Token Contract: NXDERC20 vs. NXDv3ERC20/i)).toBeInTheDocument();
  });

  it('closes via close button and backdrop, but not from clicking inside content', () => {
    const onClose = vi.fn();
    const { container } = render(<WhyModal isOpen={true} onClose={onClose} />);

    // Click inside modal body
    fireEvent.click(screen.getByText(/1. Global & Architectural Overview/i));
    expect(onClose).not.toHaveBeenCalled();

    // Click close button
    const closeBtn = screen.getByTitle('Close');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Click backdrop
    const backdrop = container.querySelector('.modal-backdrop');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
