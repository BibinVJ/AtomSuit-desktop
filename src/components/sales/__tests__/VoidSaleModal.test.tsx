import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoidSaleModal from '../VoidSaleModal';
import { voidSale } from '../../../services/SaleService';
import { toast } from 'sonner';

vi.mock('../../../services/SaleService', () => ({ voidSale: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockVoidSale = vi.mocked(voidSale);
const SALE = { id: 7, invoice_number: 'INV-0007' } as never;

const renderModal = (overrides: Record<string, unknown> = {}) => {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onSaleVoided: vi.fn(),
    sale: SALE,
    ...overrides,
  };
  render(<VoidSaleModal {...(props as never)} />);

  return props;
};

describe('VoidSaleModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVoidSale.mockResolvedValue({} as never);
  });

  it('voids the sale and notifies the parent', async () => {
    const user = userEvent.setup();
    const props = renderModal();

    await user.click(screen.getByRole('button', { name: /void/i }));

    await waitFor(() => expect(mockVoidSale).toHaveBeenCalledWith(7));
    expect(props.onSaleVoided).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('surfaces the server message when the sale cannot be voided', async () => {
    // 409 is the "this sale can't be voided" case; the reason must reach the cashier.
    mockVoidSale.mockRejectedValue({
      response: { status: 409, data: { message: 'Sale already settled' } },
    });
    const user = userEvent.setup();
    const props = renderModal();

    await user.click(screen.getByRole('button', { name: /void/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Sale already settled'));
    expect(props.onSaleVoided).not.toHaveBeenCalled();
  });

  it('shows a generic error for an unexpected failure', async () => {
    mockVoidSale.mockRejectedValue(new Error('network down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    const props = renderModal();

    await user.click(screen.getByRole('button', { name: /void/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to void sale'));
    expect(props.onSaleVoided).not.toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    renderModal({ isOpen: false });

    expect(screen.queryByRole('button', { name: /void/i })).not.toBeInTheDocument();
  });
});
