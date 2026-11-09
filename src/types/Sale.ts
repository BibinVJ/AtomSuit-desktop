import { Customer } from "./Customer";
import { Item } from "./Item";
import { User } from "./User";

export interface SaleItem {
  id: number;
  item: Item;
  quantity: number;
  unit_price: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  user: User;
  customer: Customer;
  sale_date: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  note?: string;
  items: SaleItem[];
}

export interface SaleApiResponse {
  data: Sale[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface SalePayload {
  customer_id: string;
  invoice_number: string;
  sale_date: string;
  status: string;
  payment_status: string;
  payment_method: string;
  note?: string;
  discount?: number;
  tax_percentage?: number;
  items: {
    item_id: string;
    quantity: number;
    unit_price: number;
  }[];
}
