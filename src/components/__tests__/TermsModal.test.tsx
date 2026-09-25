import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TermsModal } from '../TermsModal';

describe('TermsModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(<TermsModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal content when isOpen is true', () => {
    const onClose = vi.fn();
    render(<TermsModal isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('heading', { name: 'Terms & Disclaimer' })).toBeInTheDocument();
    expect(screen.getByText('What this site is')).toBeInTheDocument();
    expect(screen.getByText('What it never does')).toBeInTheDocument();
    expect(screen.getByText('It is not the protocol')).toBeInTheDocument();
    expect(screen.getByText(/free, open-source web interface/i)).toBeInTheDocument();
  });

  it('handles closing via close button and backdrop, but not inside content', () => {
    const onClose = vi.fn();
    const { container } = render(<TermsModal isOpen={true} onClose={onClose} />);

    // Click inside modal content should not trigger onClose
    fireEvent.click(screen.getByText('What this site is'));
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
