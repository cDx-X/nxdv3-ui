import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WebsiteQRCodeModal } from '../WebsiteQRCodeModal';

describe('WebsiteQRCodeModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<WebsiteQRCodeModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal content with QR code and origin URL when open', () => {
    const onClose = vi.fn();
    render(<WebsiteQRCodeModal isOpen={true} onClose={onClose} />);

    expect(screen.getByText('Mobile Connection (QR)')).toBeInTheDocument();
    expect(screen.getByText('Scan with your phone camera or wallet app')).toBeInTheDocument();

    const img = screen.getByAltText('QR Code to NXDv3 App');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('api.qrserver.com'));
    expect(img).toHaveAttribute(
      'src',
      expect.stringContaining(encodeURIComponent(window.location.origin))
    );

    expect(screen.getByText(window.location.origin)).toBeInTheDocument();
  });

  it('calls onClose when clicking close button and backdrop, but not inside content', () => {
    const onClose = vi.fn();
    const { container } = render(<WebsiteQRCodeModal isOpen={true} onClose={onClose} />);

    // Click inside modal content should not close it
    fireEvent.click(screen.getByText('Mobile Connection (QR)'));
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

  it('copies URL to clipboard and toggles copied state', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<WebsiteQRCodeModal isOpen={true} onClose={vi.fn()} />);

    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    expect(screen.getByText('Copy')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith(window.location.origin);
    expect(screen.getByText('Copied')).toBeInTheDocument();

    // Fast-forward 2 seconds to verify revert back to Copy
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Copy')).toBeInTheDocument();
  });
});
