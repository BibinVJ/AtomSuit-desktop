import { describe, expect, it } from 'vitest';
import { cartLineCount, cartSubtotal } from '../cart';

describe('cartSubtotal', () => {
  it('sums quantity x unit price across lines', () => {
    expect(
      cartSubtotal([
        { item_id: 1, quantity: 2, unit_price: 50 },
        { item_id: 2, quantity: 3, unit_price: 10 },
      ])
    ).toBe(130);
  });

  it('is zero for an empty cart', () => {
    expect(cartSubtotal([])).toBe(0);
  });

  it('treats blank rows as zero rather than NaN', () => {
    // The POS grid starts with an empty row; a NaN here would render as "NaN" on screen.
    expect(
      cartSubtotal([
        { item_id: null, quantity: 0, unit_price: 0 },
        { item_id: 1, quantity: 2, unit_price: 25 },
      ])
    ).toBe(50);
  });

  it('coerces string quantities and prices coming from number inputs', () => {
    expect(
      cartSubtotal([
        { item_id: 1, quantity: '2' as unknown as number, unit_price: '10.5' as unknown as number },
      ])
    ).toBe(21);
  });

  it('handles fractional quantities', () => {
    expect(cartSubtotal([{ item_id: 1, quantity: 1.5, unit_price: 10 }])).toBe(15);
  });
});

describe('cartLineCount', () => {
  it('counts only lines with an item selected', () => {
    expect(
      cartLineCount([
        { item_id: 1, quantity: 1, unit_price: 10 },
        { item_id: null, quantity: 0, unit_price: 0 },
        { item_id: 2, quantity: 1, unit_price: 10 },
      ])
    ).toBe(2);
  });

  it('is zero for an empty cart', () => {
    expect(cartLineCount([])).toBe(0);
  });
});
