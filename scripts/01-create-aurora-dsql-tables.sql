-- Aurora DSQL Compatible Schema for KoalaShop
-- This schema is simplified to work with Aurora DSQL limitations

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table for smoked fish varieties
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  units VARCHAR(10) NOT NULL DEFAULT 'oz' CHECK (units IN ('oz', 'each', 'lbs', 'grams')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  order_name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table (junction table for orders and products)
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  weight_oz DECIMAL(8,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create async indexes for better performance
CREATE INDEX ASYNC IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX ASYNC IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX ASYNC IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX ASYNC IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX ASYNC IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX ASYNC IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
