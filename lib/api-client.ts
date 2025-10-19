import apiConfig from './api-config';

// Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  unit_price: number;
  units: 'oz' | 'each' | 'lbs' | 'grams';
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  weight_oz: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  order_items?: OrderItem[];
}

// API Client Functions
export const apiClient = {
  // Products
  async getProducts(): Promise<Product[]> {
    const response = await fetch(apiConfig.endpoints.products);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    return response.json();
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const response = await fetch(apiConfig.endpoints.products, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      throw new Error(`Failed to create product: ${response.statusText}`);
    }
    return response.json();
  },

  async getProduct(id: string): Promise<Product> {
    const response = await fetch(`${apiConfig.endpoints.products}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }
    return response.json();
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const response = await fetch(`${apiConfig.endpoints.products}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      throw new Error(`Failed to update product: ${response.statusText}`);
    }
    return response.json();
  },

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${apiConfig.endpoints.products}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete product: ${response.statusText}`);
    }
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const response = await fetch(apiConfig.endpoints.customers);
    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.statusText}`);
    }
    return response.json();
  },

  async createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const response = await fetch(apiConfig.endpoints.customers, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    });
    if (!response.ok) {
      throw new Error(`Failed to create customer: ${response.statusText}`);
    }
    return response.json();
  },

  async getCustomer(id: string): Promise<Customer> {
    const response = await fetch(`${apiConfig.endpoints.customers}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch customer: ${response.statusText}`);
    }
    return response.json();
  },

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    const response = await fetch(`${apiConfig.endpoints.customers}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    });
    if (!response.ok) {
      throw new Error(`Failed to update customer: ${response.statusText}`);
    }
    return response.json();
  },

  async deleteCustomer(id: string): Promise<void> {
    const response = await fetch(`${apiConfig.endpoints.customers}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete customer: ${response.statusText}`);
    }
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    const response = await fetch(apiConfig.endpoints.orders);
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }
    return response.json();
  },

  async createOrder(order: {
    customer_id: string;
    order_items: Array<{
      product_id: string;
      quantity: number;
      weight_oz: number;
      unit_price: number;
    }>;
  }): Promise<Order> {
    const response = await fetch(apiConfig.endpoints.orders, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });
    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.statusText}`);
    }
    return response.json();
  },

  async getOrder(id: string): Promise<Order> {
    const response = await fetch(`${apiConfig.endpoints.orders}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.statusText}`);
    }
    return response.json();
  },

  async updateOrder(id: string, order: Partial<Order>): Promise<Order> {
    const response = await fetch(`${apiConfig.endpoints.orders}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });
    if (!response.ok) {
      throw new Error(`Failed to update order: ${response.statusText}`);
    }
    return response.json();
  },

  async deleteOrder(id: string): Promise<void> {
    const response = await fetch(`${apiConfig.endpoints.orders}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete order: ${response.statusText}`);
    }
  },

  // Debug
  async getDebugInfo(): Promise<any> {
    const response = await fetch(apiConfig.endpoints.debug);
    if (!response.ok) {
      throw new Error(`Failed to fetch debug info: ${response.statusText}`);
    }
    return response.json();
  },
};

export default apiClient;
