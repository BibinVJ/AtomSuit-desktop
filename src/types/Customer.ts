export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  profile_image?: string;
  total_spent?: number;
}

export interface CustomerApiResponse {
  data: Customer[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}
