/**
 * Cart arithmetic for the POS screen.
 *
 * IMPORTANT: the backend owns all money math. The only figure that can be derived safely on the
 * client is the line-extension subtotal (quantity x unit price) shown while the cashier builds the
 * cart — tax, discounts and the final invoice total are computed and returned by the API when the
 * sale is posted, and those are the numbers of record.
 *
 * Extracted from AddSale, which recomputed the same reduce three times inline.
 */

export interface CartLine {
  item_id?: number | string | null;
  quantity: number;
  unit_price: number;
}

/** Sum of quantity x unit price across the cart. Non-numeric or missing values count as zero. */
export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((total, line) => {
    const quantity = Number(line.quantity) || 0;
    const price = Number(line.unit_price) || 0;

    return total + quantity * price;
  }, 0);
}

/** Lines that actually reference an item — blank rows in the grid don't count towards the basket. */
export function cartLineCount(lines: CartLine[]): number {
  return lines.filter((line) => !!line.item_id).length;
}
