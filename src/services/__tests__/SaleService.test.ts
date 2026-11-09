import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { addSale, getNextInvoiceNumber, getSale, getSales, updateSale, voidSale } from '../SaleService';
import { getItems } from '../ItemService';
import { getCustomers } from '../CustomerService';
import { getPermissions } from '../PermissionService';

vi.mock('nprogress', () => ({ default: { start: vi.fn(), done: vi.fn() } }));

describe('POS service endpoints', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  it('lists sales with pagination and sorting in the query string', async () => {
    mock.onGet(/\/sale\?/).reply((config) => {
      expect(config.url).toContain('perPage=25');
      expect(config.url).toContain('page=2');
      expect(config.url).toContain('sort_by=invoice_number');
      expect(config.url).toContain('sort_direction=asc');
      return [200, { data: [] }];
    });

    await getSales(2, 25, 'invoice_number', 'asc');
  });

  it('defaults to the first page sorted by newest', async () => {
    mock.onGet(/\/sale\?/).reply((config) => {
      expect(config.url).toContain('page=1');
      expect(config.url).toContain('sort_by=created_at');
      expect(config.url).toContain('sort_direction=desc');
      return [200, { data: [] }];
    });

    await getSales();
  });

  it('fetches a single sale by id', async () => {
    mock.onGet('/sale/7').reply(200, { data: { id: 7 } });

    await expect(getSale('7')).resolves.toEqual({ data: { id: 7 } });
  });

  it('asks the server for the next invoice number', async () => {
    // Invoice numbers are server-authoritative; the POS must never invent one.
    mock.onGet('/sale/next-invoice-number').reply(200, { invoice_number: 'INV-0001' });

    await expect(getNextInvoiceNumber()).resolves.toEqual({ invoice_number: 'INV-0001' });
  });

  it('posts a new sale and returns the server response', async () => {
    const payload = { customer_id: 1, items: [{ item_id: 1, quantity: 2, unit_price: 50 }] };
    mock.onPost('/sale').reply((config) => {
      expect(JSON.parse(config.data as string)).toEqual(payload);
      return [201, { data: { id: 9, total_amount: '100.0000' } }];
    });

    const result = await addSale(payload as never);

    // The totals of record come back from the API, not from the cart.
    expect(result.data.total_amount).toBe('100.0000');
  });

  it('updates a sale by id', async () => {
    mock.onPut('/sale/3').reply(200, { data: { id: 3 } });

    await expect(updateSale('3', {} as never)).resolves.toEqual({ data: { id: 3 } });
  });

  it('voids a sale via DELETE', async () => {
    mock.onDelete('/sale/4').reply(200, { message: 'Voided' });

    await expect(voidSale(4)).resolves.toEqual({ message: 'Voided' });
  });

  it('propagates an API failure to the caller', async () => {
    mock.onPost('/sale').reply(422, { errors: { items: ['Insufficient stock'] } });

    await expect(addSale({} as never)).rejects.toBeTruthy();
  });

  it('fetches items, customers and permissions from their endpoints', async () => {
    mock.onGet(/\/item/).reply(200, { data: [] });
    mock.onGet(/\/customer/).reply(200, { data: [] });
    mock.onGet('/permissions').reply(200, { data: [] });

    await expect(getItems()).resolves.toBeTruthy();
    await expect(getCustomers()).resolves.toBeTruthy();
    await expect(getPermissions()).resolves.toBeTruthy();
  });
});
