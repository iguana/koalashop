-- Insert sample customers
INSERT INTO customers (name, email, phone, address) VALUES
('John Smith', 'john@example.com', '555-0101', '123 Main St, New York, NY 10001'),
('Sarah Johnson', 'sarah@example.com', '555-0102', '456 Oak Ave, Brooklyn, NY 11201'),
('Mike Chen', 'mike@example.com', '555-0103', '789 Pine St, Queens, NY 11375'),
('Lisa Rodriguez', 'lisa@example.com', '555-0104', '321 Elm St, Manhattan, NY 10002'),
('David Wilson', 'david@example.com', '555-0105', '654 Maple Dr, Bronx, NY 10451')
ON CONFLICT DO NOTHING;

-- Insert sample smoked fish products
INSERT INTO products (name, description, unit_price, units) VALUES
('Smoked Salmon', 'Premium Atlantic salmon, cold smoked', 24.99, 'oz'),
('Smoked Trout', 'Fresh rainbow trout, applewood smoked', 18.99, 'oz'),
('Smoked Whitefish', 'Great Lakes whitefish, traditional smoke', 16.99, 'oz'),
('Smoked Mackerel', 'Atlantic mackerel, hickory smoked', 14.99, 'oz'),
('Smoked Sturgeon', 'Premium sturgeon, delicate smoke', 34.99, 'oz'),
('Smoked Cod', 'Fresh Atlantic cod, oak smoked', 19.99, 'oz')
ON CONFLICT DO NOTHING;

-- Insert sample orders
INSERT INTO orders (customer_id, order_name, total_amount, status) 
SELECT 
  c.id,
  'Holiday Order',
  89.97,
  'completed'
FROM customers c 
WHERE c.email = 'john@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO orders (customer_id, order_name, total_amount, status) 
SELECT 
  c.id,
  'Weekly Order',
  43.98,
  'pending'
FROM customers c 
WHERE c.email = 'sarah@example.com'
ON CONFLICT DO NOTHING;

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, weight_oz, unit_price)
SELECT 
  o.id,
  p.id,
  2,
  16.0,
  p.unit_price
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN products p ON p.name = 'Smoked Salmon'
WHERE c.email = 'john@example.com' AND o.order_name = 'Holiday Order'
ON CONFLICT DO NOTHING;

INSERT INTO order_items (order_id, product_id, quantity, weight_oz, unit_price)
SELECT 
  o.id,
  p.id,
  1,
  12.0,
  p.unit_price
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN products p ON p.name = 'Smoked Trout'
WHERE c.email = 'sarah@example.com' AND o.order_name = 'Weekly Order'
ON CONFLICT DO NOTHING;
