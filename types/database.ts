export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  unit_price: number
  created_at: string
}

export interface Order {
  id: string
  customer_id: string
  order_name: string
  total_amount: number
  status: string
  created_at: string
  updated_at: string
  customer?: Customer
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  weight_oz: number
  unit_price: number
  total_price: number
  created_at: string
  product?: Product
}
